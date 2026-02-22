import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, XCircle, AlertTriangle, FileWarning, Upload, Loader2 } from "lucide-react";
import { categoryLabels, documentMatrixByCategory } from "@/lib/document-matrix";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState<string | null>(null);

  const { data: rejectedDocs } = useQuery({
    queryKey: ["rejected-documents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, document_type, rejection_reason, category")
        .eq("user_id", user!.id)
        .eq("status", "rejected");
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleReupload = async (docId: string, docType: string, file: File) => {
    if (!user) return;
    setUploading(docId);

    try {
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({ title: "Error", description: "El archivo excede el tamaño máximo de 10MB.", variant: "destructive" });
        return;
      }

      const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        toast({ title: "Error", description: "Solo se permiten archivos PDF, JPG y PNG.", variant: "destructive" });
        return;
      }

      const filePath = `${user.id}/${docType}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath);

      await supabase.from("documents").update({
        file_url: urlData.publicUrl,
        file_name: file.name,
        status: "uploaded",
        rejection_reason: null,
      }).eq("id", docId);

      toast({ title: "Documento reenviado", description: "Su documento ha sido enviado nuevamente para revisión." });
      queryClient.invalidateQueries({ queryKey: ["rejected-documents", user.id] });
    } catch (error: any) {
      toast({ title: "Error al subir", description: error.message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  if (!profile) return null;

  const status = statusConfig[profile.status] || statusConfig.pending_verification;

  const docLabelMap: Record<string, string> = {};
  if (profile.category) {
    const matrix = documentMatrixByCategory[profile.category] || [];
    matrix.forEach((req) => { docLabelMap[req.key] = req.label; });
  }

  return (
    <AppLayout title="Estado de su Solicitud" description={profile.category ? categoryLabels[profile.category] : "Sin categoría asignada"}>
      <div className="max-w-2xl space-y-6">
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

        {rejectedDocs && rejectedDocs.length > 0 && (
          <Card className="border-destructive/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                <FileWarning className="h-5 w-5" />
                Documentos con Observaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rejectedDocs.map((doc) => (
                <div key={doc.id} className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 space-y-2">
                  <p className="font-medium text-sm font-sans">
                    {docLabelMap[doc.document_type] || doc.document_type}
                  </p>
                  {doc.rejection_reason && (
                    <p className="text-sm text-muted-foreground font-sans">
                      <span className="font-medium text-destructive">Observación:</span> {doc.rejection_reason}
                    </p>
                  )}
                  <label className="cursor-pointer inline-block">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleReupload(doc.id, doc.document_type, file);
                        e.target.value = "";
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      disabled={uploading === doc.id}
                    >
                      <span>
                        {uploading === doc.id ? (
                          <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Subiendo...</>
                        ) : (
                          <><Upload className="h-4 w-4 mr-1" /> Reenviar Documento</>
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
