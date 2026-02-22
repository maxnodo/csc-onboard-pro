import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find profiles with approved_documentation older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: expiredProfiles, error: fetchError } = await supabase
      .from("profiles")
      .select("id, email, full_name, approved_documentation_at")
      .eq("status", "approved_documentation")
      .lt("approved_documentation_at", thirtyDaysAgo.toISOString());

    if (fetchError) {
      throw fetchError;
    }

    if (!expiredProfiles || expiredProfiles.length === 0) {
      return new Response(
        JSON.stringify({ message: "No expired profiles found", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const expiredIds = expiredProfiles.map((p) => p.id);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ status: "expired_documentation" })
      .in("id", expiredIds);

    if (updateError) {
      throw updateError;
    }

    console.log(`Expired ${expiredIds.length} profiles:`, expiredIds);

    return new Response(
      JSON.stringify({
        message: `Successfully expired ${expiredIds.length} profiles`,
        count: expiredIds.length,
        expired_ids: expiredIds,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in expire-documentation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
