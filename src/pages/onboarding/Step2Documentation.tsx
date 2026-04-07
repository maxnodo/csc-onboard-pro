import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { documentMatrixByCategory, categoryLabels } from "@/lib/document-matrix";
import { generateHojaConsignacion } from "@/lib/generate-hoja-consignacion";
import OnboardingLayout from "./OnboardingLayout";
import { Upload, FileText, CheckCircle2, Clock, ArrowLeft, ArrowRight, Download, X } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Document = Tables<"documents">;

const statusBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendiente", variant: "outline" },
  uploaded: { label: "Subido", variant: "default" },
  under_review: { label: "En Revisión", variant: "secondary" },
  approved: { label: "Aprobado", variant: "default" },
  rejected: { label: "Rechazado", variant: "destructive" },
};

const Step2Documentation = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);

  const category = profile?.category;
  const requirements = category ? documentMatrixByCategory[category] || [] : [];

  const loadDocuments = useCallback(async () => {
    if (!user || !category) return;
    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", user.id)
      .eq("category", category);
    setDocuments(data || []);
  }, [user, category]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleUpload = async (docType: string, files: FileList) => {
    if (!user || !category) return;
    setUploading(docType);

    try {
      for (const file of Array.from(files)) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          toast({ title: "Error", description: `El archivo ${file.name} excede el tamaño máximo de 10MB.`, variant: "destructive" });
          continue;
        }

        const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
        if (!allowedTypes.includes(file.type)) {
          toast({ title: "Error", description: `Tipo de archivo no permitido: ${file.name}. Solo PDF, JPG y PNG.`, variant: "destructive" });
          continue;
        }

        const filePath = `${user.id}/${docType}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
        if (uploadError) throw uploadError;

        // Check if document record exists for this type (non-multiple)
        const req = requirements.find((r) => r.key === docType);
        const existingDoc = documents.find((d) => d.document_type === docType);

        if (existingDoc && !req?.multiple) {
          // Delete old file from storage
          if (existingDoc.file_url) {
            let oldPath = existingDoc.file_url;
            if (oldPath.includes("/storage/v1/")) {
              oldPath = oldPath.split("/object/public/documents/")[1] || oldPath;
            }
            if (oldPath.startsWith("documents/")) {
              oldPath = oldPath.substring("documents/".length);
            }
            await supabase.storage.from("documents").remove([oldPath]);
          }
          await supabase.from("documents").update({
            file_url: filePath,
            file_name: file.name,
            status: "uploaded",
            rejection_reason: null,
          }).eq("id", existingDoc.id);
        } else {
          await supabase.from("documents").insert({
            user_id: user.id,
            document_type: docType,
            file_url: filePath,
            file_name: file.name,
            status: "uploaded",
            category,
            multiple: req?.multiple || false,
            conditional: req?.conditional || false,
          });
        }
      }

      toast({ title: "Archivo subido", description: "Documento cargado exitosamente." });
      await loadDocuments();
    } catch (error: any) {
      toast({ title: "Error al subir", description: error.message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  const getDocsForType = (docType: string) => documents.filter((d) => d.document_type === docType);

  const handleGenerateDocument = async (docType: string) => {
    if (docType === "hoja_consignacion") {
      try {
        // Fetch form_data for pre-filling
        const { data: formDataRow } = await supabase
          .from("form_data")
          .select("form_data")
          .eq("user_id", user!.id)
          .eq("category", category!)
          .maybeSingle();

        const fd = (formDataRow?.form_data as Record<string, any>) || {};

        // Determine razón social based on category
        let razonSocial = "";
        if (category === "distribuidor" || category === "constructor") {
          razonSocial = fd.razon_social || "";
        } else if (category === "emprendedor") {
          razonSocial = fd.nombre_completo || "";
        } else if (category === "alcaldia") {
          razonSocial = fd.nombre_ente || "";
        }

        const rif = fd.rif || fd.rif_institucional || "";

        // Build set of uploaded/approved doc types
        const uploadedDocTypes = new Set<string>();
        for (const d of documents) {
          if (d.status === "uploaded" || d.status === "approved") {
            uploadedDocTypes.add(d.document_type);
          }
        }

        await generateHojaConsignacion({
          razonSocial,
          rif,
          representanteLegal: fd.representante_legal || profile?.full_name || "",
          cedulaRepresentante: fd.cedula || "",
          celular: profile?.phone || fd.telefono || "",
          telefonoFijo: fd.telefono_institucional || "",
          correo: profile?.email || fd.correo || fd.correo_institucional || "",
          requirements,
          uploadedDocTypes,
          category: category!,
          categoryLabel: category ? categoryLabels[category] : "",
        });

        toast({ title: "PDF generado", description: "Descargue, firme, selle y vuelva a cargar el documento." });
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
      return;
    }

    // Carta de solicitud — keep as .txt
    const title = "CARTA DE SOLICITUD";
    const content = `
CORPORACIÓN SOCIALISTA DE CEMENTO (CSC)
${title}

Fecha: ${new Date().toLocaleDateString("es-VE")}
Categoría: ${category ? categoryLabels[category] : ""}
Solicitante: ${profile?.full_name || ""}
Correo: ${profile?.email || ""}

Este documento ha sido generado automáticamente por el Sistema de Onboarding Documental de CSC.
El solicitante debe imprimir, firmar y volver a cargar este documento firmado.

_________________________
Firma del Solicitante

_________________________
Nombre y Cédula
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/ /g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Documento generado", description: "Descargue, firme y vuelva a cargar el documento firmado." });
  };

  const allRequired = requirements.filter((r) => !r.conditional);
  const uploadedCount = allRequired.filter((r) => getDocsForType(r.key).some((d) => d.status !== "pending")).length;

  const handleContinue = async () => {
    const missingDocs = allRequired.filter((r) => !getDocsForType(r.key).some((d) => d.status !== "pending"));
    if (missingDocs.length > 0) {
      toast({
        title: "Documentos faltantes",
        description: `Faltan: ${missingDocs.map((d) => d.label).join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    await supabase.from("profiles").update({ onboarding_step: 3 }).eq("id", user!.id);
    await refreshProfile();
    navigate("/onboarding/step-3");
  };

  if (!category) return null;

  return (
    <OnboardingLayout
      currentStep={2}
      title="Etapa 2 – Documentación"
      description={`Cargue los documentos requeridos (${uploadedCount}/${allRequired.length} completados)`}
    >
      <div className="space-y-4">
        {requirements.map((req) => {
          const docs = getDocsForType(req.key);
          const hasUpload = docs.some((d) => d.status !== "pending");
          const hasRejected = docs.some((d) => d.status === "rejected");
          const isGenerated = req.type === "FORM_GENERATED_FILE_UPLOAD";

          return (
            <Card key={req.key} className={hasRejected ? "border-destructive/40 bg-destructive/5" : hasUpload ? "border-primary/30" : ""}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`mt-0.5 p-2 rounded-lg ${hasUpload ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {hasUpload ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm font-sans">{req.label}</span>
                        {req.conditional && (
                          <Badge variant="outline" className="text-xs">{req.conditionalLabel}</Badge>
                        )}
                        {req.multiple && (
                          <Badge variant="secondary" className="text-xs">Múltiples</Badge>
                        )}
                      </div>
                      {docs.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {docs.map((doc) => {
                            const isRejected = doc.status === "rejected";
                            return (
                              <div key={doc.id}>
                                <div className={`flex items-center gap-2 text-xs ${isRejected ? "text-destructive" : "text-muted-foreground"}`}>
                                  <FileText className="h-3 w-3" />
                                  <span className="truncate">{doc.file_name}</span>
                                  <Badge variant={statusBadge[doc.status]?.variant || "outline"} className="text-xs">
                                    {statusBadge[doc.status]?.label || doc.status}
                                  </Badge>
                                </div>
                                {isRejected && doc.rejection_reason && (
                                  <p className="text-xs text-destructive mt-1 ml-5 font-medium">
                                    <span className="font-semibold">Observación:</span> {doc.rejection_reason}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isGenerated && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateDocument(req.key)}
                      >
                        <Download className="h-4 w-4 mr-1" /> Generar
                      </Button>
                    )}
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        multiple={req.multiple}
                        onChange={(e) => e.target.files && handleUpload(req.key, e.target.files)}
                      />
                      <Button
                        variant={hasUpload ? "outline" : "default"}
                        size="sm"
                        asChild
                        disabled={uploading === req.key}
                      >
                        <span>
                          <Upload className="h-4 w-4 mr-1" />
                          {uploading === req.key ? "Subiendo..." : hasUpload && !req.multiple ? "Reemplazar" : "Subir"}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-8 pt-6 border-t">
        <Button variant="outline" onClick={() => navigate("/onboarding/step-1")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Anterior
        </Button>
        <Button onClick={handleContinue}>
          Continuar <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </OnboardingLayout>
  );
};

export default Step2Documentation;
