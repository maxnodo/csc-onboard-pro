import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, LogOut, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { categoryLabels } from "@/lib/document-matrix";

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
  const { profile, signOut } = useAuth();

  if (!profile) return null;

  const status = statusConfig[profile.status] || statusConfig.pending_verification;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-primary font-sans">CSC</h1>
              <p className="text-xs text-muted-foreground">Sistema de Onboarding Documental</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" /> Cerrar Sesión
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Estado de su Solicitud</CardTitle>
            <CardDescription>
              {profile.category ? categoryLabels[profile.category] : "Sin categoría asignada"}
            </CardDescription>
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
      </main>
    </div>
  );
};

export default Dashboard;
