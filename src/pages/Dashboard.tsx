import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { categoryLabels } from "@/lib/document-matrix";
import AppLayout from "@/components/AppLayout";
import ProfileImageUpload from "@/components/ProfileImageUpload";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending_verification: { label: "Verificación Pendiente", icon: <Clock className="h-5 w-5" />, color: "bg-warning/10 text-warning" },
  onboarding_started: { label: "Onboarding en Progreso", icon: <Clock className="h-5 w-5" />, color: "bg-primary/10 text-primary" },
  under_review: { label: "En Revisión", icon: <Clock className="h-5 w-5" />, color: "bg-secondary/20 text-secondary-foreground" },
  approved_documentation: { label: "Documentación Aprobada", icon: <CheckCircle2 className="h-5 w-5" />, color: "bg-success/10 text-success" },
  expired_documentation: { label: "Documentación Vencida", icon: <AlertTriangle className="h-5 w-5" />, color: "bg-warning/10 text-warning" },
  rejected: { label: "Rechazado", icon: <XCircle className="h-5 w-5" />, color: "bg-destructive/10 text-destructive" },
  rejected_presencial: { label: "Rechazado Presencialmente", icon: <XCircle className="h-5 w-5" />, color: "bg-destructive/10 text-destructive" },
  active_final: { label: "Activo", icon: <CheckCircle2 className="h-5 w-5" />, color: "bg-success/10 text-success" },
};

const Dashboard = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    // Load current profile image from form_data
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
  };

  if (!profile) return null;

  const status = statusConfig[profile.status] || statusConfig.pending_verification;

  return (
    <AppLayout title="Estado de su Solicitud" description={profile.category ? categoryLabels[profile.category] : "Sin categoría asignada"}>
      <div className="max-w-2xl space-y-6">
        {/* Profile Image */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Mi Perfil</CardTitle>
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
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Estado Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`flex items-center gap-3 p-4 rounded-lg ${status.color}`}>
              {status.icon}
              <div>
                <p className="font-semibold font-sans">{status.label}</p>
                <p className="text-sm opacity-80 font-sans">
                  {profile.status === "under_review" && "Su documentación está siendo revisada por el equipo administrativo de CSC."}
                  {profile.status === "approved_documentation" && "Su documentación ha sido aprobada. Debe presentarse en la sede asignada para completar el proceso."}
                  {profile.status === "active_final" && "Su proceso ha sido completado exitosamente. Ya puede operar con CSC."}
                  {profile.status === "rejected" && "Su solicitud ha sido rechazada. Revise el motivo y contacte al administrador."}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm font-sans">
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

export default Dashboard;
