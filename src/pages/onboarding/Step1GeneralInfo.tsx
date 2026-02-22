import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formFieldsByCategory, categoryLabels } from "@/lib/document-matrix";
import ProfileImageUpload from "@/components/ProfileImageUpload";
import OnboardingLayout from "./OnboardingLayout";
import { Save, ArrowRight } from "lucide-react";

const Step1GeneralInfo = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const category = profile?.category;
  const fields = category ? formFieldsByCategory[category] || [] : [];

  useEffect(() => {
    if (!user || !category) return;
    // Load saved form data
    supabase
      .from("form_data")
      .select("form_data")
      .eq("user_id", user.id)
      .eq("category", category)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.form_data && typeof data.form_data === "object" && !Array.isArray(data.form_data)) {
          const loaded: Record<string, string> = {};
          const fd = data.form_data as Record<string, unknown>;
          for (const [k, v] of Object.entries(fd)) {
            if (k === "_profile_image_url") {
              setProfileImageUrl(String(v ?? ""));
            } else {
              loaded[k] = String(v ?? "");
            }
          }
          setFormValues(loaded);
        }
      });
  }, [user, category]);

  const handleChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const saveProgress = async () => {
    if (!user || !category) return;
    setSaving(true);

    const dataToSave = { ...formValues, ...(profileImageUrl ? { _profile_image_url: profileImageUrl } : {}) };

    const { data: existing } = await supabase
      .from("form_data")
      .select("id")
      .eq("user_id", user.id)
      .eq("category", category)
      .maybeSingle();

    if (existing) {
      await supabase.from("form_data").update({ form_data: dataToSave }).eq("id", existing.id);
    } else {
      await supabase.from("form_data").insert({ user_id: user.id, category, form_data: dataToSave });
    }

    toast({ title: "Guardado", description: "Progreso guardado exitosamente." });
    setSaving(false);
  };

  const handleContinue = async () => {
    // Validate required fields
    const missing = fields.filter((f) => f.required && !formValues[f.key]?.trim());
    if (missing.length > 0) {
      toast({
        title: "Campos obligatorios",
        description: `Complete los siguientes campos: ${missing.map((f) => f.label).join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    await saveProgress();

    await supabase.from("profiles").update({ onboarding_step: 2 }).eq("id", user!.id);
    await refreshProfile();
    navigate("/onboarding/step-2");
  };

  if (!category) return null;

  return (
    <OnboardingLayout
      currentStep={1}
      title="Etapa 1 – Información General"
      description={`Complete los datos requeridos para la categoría: ${categoryLabels[category]}`}
    >
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProfileImageUpload
              userId={user!.id}
              currentImageUrl={profileImageUrl}
              onImageUploaded={(url) => setProfileImageUrl(url)}
              onImageRemoved={() => setProfileImageUrl(null)}
              isCompany={category !== "emprendedor"}
            />
            {fields.map((field) => (
              <div key={field.key} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                <Label htmlFor={field.key} className="font-sans text-sm">
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </Label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={field.key}
                    value={formValues[field.key] || ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="mt-1"
                  />
                ) : (
                  <Input
                    id={field.key}
                    type={field.type}
                    value={formValues[field.key] || ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="mt-1"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button variant="outline" onClick={saveProgress} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Guardando..." : "Guardar Progreso"}
            </Button>
            <Button onClick={handleContinue}>
              Continuar <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
};

export default Step1GeneralInfo;
