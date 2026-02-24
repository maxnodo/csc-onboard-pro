import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle, AlertTriangle, FileWarning, Upload, Loader2, ChevronLeft, ChevronRight, ShieldCheck, FileX, FileText, Download } from "lucide-react";
import { categoryLabels, documentMatrixByCategory } from "@/lib/document-matrix";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  pending_verification: { label: "Verificación Pendiente", icon: <Clock className="h-6 w-6" />, color: "text-warning", bg: "bg-warning/10 border-warning/20" },
  onboarding_started: { label: "Onboarding en Progreso", icon: <Clock className="h-6 w-6" />, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
  under_review: { label: "En Revisión", icon: <Clock className="h-6 w-6" />, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
  approved_documentation: { label: "Documentación Aprobada", icon: <CheckCircle2 className="h-6 w-6" />, color: "text-success", bg: "bg-success/10 border-success/20" },
  expired_documentation: { label: "Documentación Vencida", icon: <AlertTriangle className="h-6 w-6" />, color: "text-warning", bg: "bg-warning/10 border-warning/20" },
  rejected: { label: "Rechazado", icon: <XCircle className="h-6 w-6" />, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
  rejected_presencial: { label: "Rechazado Presencialmente", icon: <XCircle className="h-6 w-6" />, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
  active_final: { label: "Activo", icon: <ShieldCheck className="h-6 w-6" />, color: "text-success", bg: "bg-success/10 border-success/20" },
};

const statusDescriptions: Record<string, string> = {
  pending_verification: "Su cuenta está pendiente de verificación. Pronto recibirá una actualización.",
  onboarding_started: "Su proceso de onboarding está en progreso. Complete los pasos pendientes.",
  under_review: "Su documentación está siendo revisada por el equipo administrativo de CSC.",
  approved_documentation: "Su documentación ha sido aprobada. Debe presentarse en la sede asignada para completar el proceso.",
  active_final: "Su proceso ha sido completado exitosamente. Ya puede operar con CSC.",
  rejected: "Su solicitud ha sido rechazada. Revise los documentos con observaciones abajo.",
  rejected_presencial: "Su solicitud fue rechazada presencialmente. Contacte al administrador.",
  expired_documentation: "Su documentación ha vencido. Debe actualizar los documentos requeridos.",
};

const DOCS_PER_PAGE = 5;

const Dashboard = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const { data: allDocs } = useQuery({
    queryKey: ["user-documents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, document_type, rejection_reason, category, status, file_name")
        .eq("user_id", user!.id)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const rejectedDocs = allDocs?.filter((d) => d.status === "rejected") || [];

  // Calculate missing required documents
  const category = profile?.category;
  const requirements = category ? documentMatrixByCategory[category] || [] : [];
  const requiredDocs = requirements.filter((r) => !r.conditional);
  const missingDocs = requiredDocs.filter(
    (req) => !allDocs?.some((d) => d.document_type === req.key)
  );
  const canUploadMore = profile?.status === "under_review" || profile?.status === "rejected";

  const handleUploadNew = async (docType: string, file: File) => {
    if (!user || !category) return;
    setUploading(docType);

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

      const req = requirements.find((r) => r.key === docType);
      const filePath = `${user.id}/${docType}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
      if (uploadError) throw uploadError;

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

      toast({ title: "Documento subido", description: "Su documento ha sido enviado para revisión." });
      queryClient.invalidateQueries({ queryKey: ["user-documents", user.id] });
    } catch (error: any) {
      toast({ title: "Error al subir", description: error.message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  const handleGenerateDocument = (docType: string) => {
    const title = docType === "hoja_consignacion" ? "HOJA DE CONSIGNACIÓN" : "CARTA DE SOLICITUD";
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

      const { data: oldDoc } = await supabase.from("documents").select("file_url").eq("id", docId).maybeSingle();
      if (oldDoc?.file_url) {
        let oldPath = oldDoc.file_url;
        if (oldPath.includes("/storage/v1/")) {
          oldPath = oldPath.split("/object/public/documents/")[1] || oldPath;
        }
        if (oldPath.startsWith("documents/")) {
          oldPath = oldPath.substring("documents/".length);
        }
        await supabase.storage.from("documents").remove([oldPath]);
      }

      const filePath = `${user.id}/${docType}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
      if (uploadError) throw uploadError;

      await supabase.from("documents").update({
        file_url: filePath,
        file_name: file.name,
        status: "uploaded",
        rejection_reason: null,
      }).eq("id", docId);

      toast({ title: "Documento reenviado", description: "Su documento ha sido enviado nuevamente para revisión." });
      queryClient.invalidateQueries({ queryKey: ["user-documents", user.id] });
    } catch (error: any) {
      toast({ title: "Error al subir", description: error.message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  if (!profile) return null;

  const status = statusConfig[profile.status] || statusConfig.pending_verification;
  const description = statusDescriptions[profile.status] || "";

  const docLabelMap: Record<string, string> = {};
  if (profile.category) {
    const matrix = documentMatrixByCategory[profile.category] || [];
    matrix.forEach((req) => { docLabelMap[req.key] = req.label; });
  }

  const totalRejected = rejectedDocs.length;
  const totalPages = Math.ceil(totalRejected / DOCS_PER_PAGE);
  const paginatedDocs = rejectedDocs.slice(page * DOCS_PER_PAGE, (page + 1) * DOCS_PER_PAGE);

  const docStatusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: "Pendiente", color: "bg-muted text-muted-foreground" },
    uploaded: { label: "Subido", color: "bg-primary/10 text-primary" },
    under_review: { label: "En Revisión", color: "bg-warning/10 text-warning" },
    approved: { label: "Aprobado", color: "bg-success/10 text-success" },
    rejected: { label: "Rechazado", color: "bg-destructive/10 text-destructive" },
  };

  const progressMap: Record<string, number> = {
    pending_verification: 10,
    onboarding_started: 30,
    under_review: 60,
    approved_documentation: 80,
    rejected: 50,
    rejected_presencial: 50,
    expired_documentation: 70,
    active_final: 100,
  };
  const progressValue = progressMap[profile.status] ?? 10;

  return (
    <AppLayout title="Estado de su Solicitud" description={profile.category ? categoryLabels[profile.category] : "Sin categoría asignada"}>
      <div className="max-w-2xl space-y-6">
        {/* Status Card */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className={`flex items-start gap-4 p-6 border-l-4 ${status.bg}`}>
              <div className={`mt-0.5 ${status.color}`}>
                {status.icon}
              </div>
              <div className="flex-1 space-y-1">
                <h3 className={`text-lg font-bold font-sans ${status.color}`}>{status.label}</h3>
                <p className="text-sm text-muted-foreground font-sans leading-relaxed">{description}</p>
              </div>
            </div>
            <div className="px-6 pb-5 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Progreso general</span>
                <span className="text-xs font-semibold text-foreground">{progressValue}%</span>
              </div>
              <Progress value={progressValue} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Missing Documents - Upload Section */}
        {canUploadMore && missingDocs.length > 0 && (
          <Card className="border-warning/30 overflow-hidden">
            <CardHeader className="pb-2 pt-5 px-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 text-warning">
                  <FileWarning className="h-5 w-5" />
                  Documentos Pendientes por Subir
                </CardTitle>
                <span className="text-xs font-medium bg-warning/10 text-warning px-2.5 py-1 rounded-full">
                  {missingDocs.length} {missingDocs.length === 1 ? "faltante" : "faltantes"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-5 space-y-3">
              {missingDocs.map((req) => {
                const isGenerated = req.type === "FORM_GENERATED_FILE_UPLOAD";
                return (
                  <div
                    key={req.key}
                    className="flex items-center justify-between p-4 rounded-lg border border-warning/20 bg-warning/5 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Clock className="h-5 w-5 text-warning shrink-0" />
                      <div>
                        <p className="font-medium text-sm font-sans">{req.label}</p>
                        {req.multiple && (
                          <Badge variant="secondary" className="text-xs mt-1">Múltiples</Badge>
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
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadNew(req.key, file);
                            e.target.value = "";
                          }}
                        />
                        <Button
                          variant="default"
                          size="sm"
                          asChild
                          disabled={uploading === req.key}
                        >
                          <span>
                            {uploading === req.key ? (
                              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Subiendo...</>
                            ) : (
                              <><Upload className="h-4 w-4 mr-1" /> Subir</>
                            )}
                          </span>
                        </Button>
                      </label>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* All Documents List */}
        {allDocs && allDocs.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-5 px-6">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Mis Documentos
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-5 space-y-2">
              {allDocs.map((doc) => {
                const st = docStatusConfig[doc.status] || docStatusConfig.pending;
                const isRejected = doc.status === "rejected";
                return (
                  <div
                    key={doc.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isRejected ? "border-destructive/40 bg-destructive/5" : ""}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm font-sans">
                        {docLabelMap[doc.document_type] || doc.document_type.replace(/_/g, " ")}
                      </p>
                      {isRejected && doc.rejection_reason && (
                        <p className="text-xs text-destructive mt-1 font-medium">
                          <span className="font-semibold">Observación:</span> {doc.rejection_reason}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className={`text-xs shrink-0 ml-3 ${st.color}`}>
                      {st.label}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Rejected Documents - Reupload */}
        {totalRejected > 0 && (
          <Card className="border-destructive/20 overflow-hidden">
            <CardHeader className="pb-2 pt-5 px-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <FileX className="h-5 w-5" />
                  Documentos con Observaciones
                </CardTitle>
                <span className="text-xs font-medium bg-destructive/10 text-destructive px-2.5 py-1 rounded-full">
                  {totalRejected} {totalRejected === 1 ? "documento" : "documentos"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-5 space-y-3">
              {paginatedDocs.map((doc, idx) => (
                <div
                  key={doc.id}
                  className="group relative p-4 rounded-xl bg-card border border-border hover:border-destructive/30 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm font-sans">
                      {docLabelMap[doc.document_type] || doc.document_type}
                    </p>
                    <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                      {page * DOCS_PER_PAGE + idx + 1}/{totalRejected}
                    </span>
                  </div>
                  {doc.rejection_reason && (
                    <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                      <span className="font-semibold text-destructive">Observación:</span>{" "}
                      {doc.rejection_reason}
                    </p>
                  )}
                  <label className="cursor-pointer inline-block mt-1">
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
                      className="border-primary/30 hover:bg-primary/5 hover:border-primary/50"
                    >
                      <span>
                        {uploading === doc.id ? (
                          <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Subiendo...</>
                        ) : (
                          <><Upload className="h-4 w-4 mr-1.5" /> Reenviar Documento</>
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
              ))}

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="text-xs"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Página {page + 1} de {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="text-xs"
                  >
                    Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
