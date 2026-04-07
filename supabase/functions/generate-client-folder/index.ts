import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  BlobWriter,
  BlobReader,
  ZipWriter,
} from "https://deno.land/x/zipjs@v2.7.34/index.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Official document order per category (mirrors src/lib/document-matrix.ts)
const categoryDocOrder: Record<string, string[]> = {
  distribuidor: [
    "hoja_consignacion",
    "carta_solicitud",
    "acta_constitutiva",
    "declaracion_islr_iva",
    "acta_asamblea",
    "cedula_accionistas",
    "rif_empresa",
    "rif_accionistas",
    "registro_fotografico",
    "referencias_comerciales",
    "referencia_bancaria",
  ],
  constructor: [
    "hoja_consignacion",
    "carta_solicitud",
    "acta_constitutiva",
    "declaracion_islr_iva",
    "acta_asamblea",
    "cedula_accionistas",
    "rif_empresa_accionistas",
    "registro_fotografico",
    "memoria_descriptiva",
    "contrato_obra",
    "acta_prorroga",
    "referencias_comerciales",
    "referencia_bancaria",
  ],
  emprendedor: [
    "hoja_consignacion",
    "carta_solicitud",
    "registro_emprendedor",
    "cedula_identidad",
    "rif",
    "registro_fotografico",
    "registro_ivss",
    "registro_inces",
    "registro_faov",
  ],
  alcaldia: [
    "hoja_consignacion",
    "carta_solicitud",
    "gaceta_oficial",
    "nombramiento_autoridad",
    "cedula_autoridad",
    "rif_institucional",
    "carnet_patria",
  ],
};

function sanitizeName(name: string): string {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).replace(/ /g, "_");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Authenticate user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    // Use service role for all DB operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("category, sede_id, status")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (profile.status !== "approved_documentation") {
      return new Response(
        JSON.stringify({ error: "Documentation not approved" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const category = profile.category as string;
    const order = categoryDocOrder[category] || [];

    // Get approved/uploaded documents
    const { data: docs, error: docsError } = await supabase
      .from("documents")
      .select("document_type, file_url, file_name")
      .eq("user_id", userId)
      .in("status", ["approved", "uploaded"])
      .order("created_at");

    if (docsError) throw docsError;
    if (!docs || docs.length === 0) {
      return new Response(JSON.stringify({ error: "No documents found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group documents by type (some types allow multiple files)
    const docsByType: Record<string, typeof docs> = {};
    for (const doc of docs) {
      if (!doc.file_url) continue;
      if (!docsByType[doc.document_type]) {
        docsByType[doc.document_type] = [];
      }
      docsByType[doc.document_type].push(doc);
    }

    // Build ordered file list
    const filesToZip: { name: string; path: string }[] = [];
    let counter = 1;

    for (const docKey of order) {
      const docsForKey = docsByType[docKey];
      if (!docsForKey || docsForKey.length === 0) continue;

      for (let i = 0; i < docsForKey.length; i++) {
        const doc = docsForKey[i];
        const ext = doc.file_name?.split(".").pop() || "pdf";
        const baseName = sanitizeName(docKey);
        const suffix = docsForKey.length > 1 ? `_${i + 1}` : "";
        const num = String(counter).padStart(2, "0");
        filesToZip.push({
          name: `${num}_${baseName}${suffix}.${ext}`,
          path: doc.file_url!,
        });
        counter++;
      }
    }

    // Also include any docs not in the official order
    for (const [docKey, docsForKey] of Object.entries(docsByType)) {
      if (order.includes(docKey)) continue;
      for (let i = 0; i < docsForKey.length; i++) {
        const doc = docsForKey[i];
        const ext = doc.file_name?.split(".").pop() || "pdf";
        const baseName = sanitizeName(docKey);
        const suffix = docsForKey.length > 1 ? `_${i + 1}` : "";
        const num = String(counter).padStart(2, "0");
        filesToZip.push({
          name: `${num}_${baseName}${suffix}.${ext}`,
          path: doc.file_url!,
        });
        counter++;
      }
    }

    // Create ZIP
    const zipBlobWriter = new BlobWriter("application/zip");
    const zipWriter = new ZipWriter(zipBlobWriter);

    for (const file of filesToZip) {
      const { data: signedData, error: signError } = await supabase.storage
        .from("documents")
        .createSignedUrl(file.path, 3600);

      if (signError || !signedData?.signedUrl) {
        console.warn(`Could not sign URL for ${file.path}:`, signError);
        continue;
      }

      const response = await fetch(signedData.signedUrl);
      if (!response.ok) {
        console.warn(`Could not download ${file.path}: ${response.status}`);
        continue;
      }

      const blob = await response.blob();
      await zipWriter.add(file.name, new BlobReader(blob));
    }

    await zipWriter.close();
    const zipBlob = await zipBlobWriter.getData();

    // Upload ZIP to bucket
    const timestamp = Date.now();
    const zipPath = `carpetas/${userId}/carpeta_${timestamp}.zip`;
    const zipArrayBuffer = await zipBlob.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(zipPath, zipArrayBuffer, {
        contentType: "application/zip",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Generate signed URL for download
    const { data: zipSignedData, error: zipSignError } = await supabase.storage
      .from("documents")
      .createSignedUrl(zipPath, 3600);

    if (zipSignError) throw zipSignError;

    // Update last_folder_download_at
    await supabase
      .from("profiles")
      .update({ last_folder_download_at: new Date().toISOString() })
      .eq("id", userId);

    return new Response(
      JSON.stringify({
        url: zipSignedData.signedUrl,
        filename: `carpeta_${timestamp}.zip`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-client-folder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
