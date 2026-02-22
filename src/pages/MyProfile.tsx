import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AppLayout from "@/components/AppLayout";
import ProfileImageUpload from "@/components/ProfileImageUpload";
import { useToast } from "@/hooks/use-toast";
import { categoryLabels } from "@/lib/document-matrix";

const MyProfile = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("form_data")
      .select("form_data")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.form_data && typeof data.form_data === "object" && !Array.isArray(data.form_data)) {
          const fd = data.form_data as Record<string, unknown>;
          if (fd._profile_image_url) {
            setProfileImageUrl(String(fd._profile_image_url));
          }
        }
      });
  }, [user]);

  const saveImageUrl = async (url: string | null) => {
    if (!user) return;
    const { data: existing } = await supabase
      .from("form_data")
      .select("id, form_data")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      const currentData = (typeof existing.form_data === "object" && !Array.isArray(existing.form_data))
        ? existing.form_data as Record<string, unknown>
        : {};
      const updated = { ...currentData, _profile_image_url: url || "" };
      await supabase.from("form_data").update({ form_data: updated }).eq("id", existing.id);
    }
    setProfileImageUrl(url);
    toast({ title: url ? "Imagen actualizada" : "Imagen eliminada" });
  };

  if (!profile || !user) return null;

  return (
    <AppLayout title="Mi Perfil" description="Gestione su información personal">
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Imagen de Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileImageUpload
              userId={user.id}
              currentImageUrl={profileImageUrl}
              onImageUploaded={(url) => saveImageUrl(url)}
              onImageRemoved={() => saveImageUrl(null)}
              label="Imagen de Perfil / Logo"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Información Personal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm font-sans">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Correo</span>
                <span>{profile.email}</span>
              </div>
              {profile.full_name && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Nombre</span>
                  <span>{profile.full_name}</span>
                </div>
              )}
              {profile.phone && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Teléfono</span>
                  <span>{profile.phone}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Categoría</span>
                <span>{profile.category ? categoryLabels[profile.category] : "—"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default MyProfile;
