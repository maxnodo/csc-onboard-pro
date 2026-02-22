import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "./AdminLayout";
import { categoryLabels } from "@/lib/document-matrix";
import {
  ArrowLeft, CheckCircle2, XCircle, FileText, Clock,
  Download, ExternalLink, MapPin, User, Mail, Phone,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Document = Tables<"documents">;
type Sede = Tables<"sedes">;

const statusLabels: Record<string, string> = {
  pending_verification: "Verificación Pendiente",
  onboarding_started: "En Onboarding",
  under_review: "En Revisión",
  approved_documentation: "Doc. Aprobada",
  expired_documentation: "Doc. Vencida",
  rejected: "Rechazado",
  rejected_presencial: "Rechazado Presencial",
  active_final: "Activo",
};

const docStatusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-muted text-muted-foreground" },
  uploaded: { label: "Subido", color: "bg-primary/10 text-primary" },
  under_review: { label: "En Revisión", color: "bg-warning/10 text-warning" },
  approved: { label: "Aprobado", color: "bg-success/10 text-success" },
  rejected: { label: "Rechazado", color: "bg-destructive/10 text-destructive" },
};

const RequestReview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [formData, setFormData] = useState<Record<string, unknown> | null>(null);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [loading, setLoading] = useState(true);

  // Approve dialog
  const [showApprove, setShowApprove] = useState(false);
  const [selectedSede, setSelectedSede] = useState<string>("");

  // Reject dialog
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Doc action
  const [docActionId, setDocActionId] = useState<string | null>(null);
  const [docRejectReason, setDocRejectReason] = useState("");
  const [showDocReject, setShowDocReject] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    const [profileRes, docsRes, formRes, sedesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", id!).single(),
      supabase.from("documents").select("*").eq("user_id", id!).order("created_at"),
      supabase.from("form_data").select("*").eq("user_id", id!).maybeSingle(),
      supabase.from("sedes").select("*").eq("activa", true).order("nombre"),
    ]);
    setProfile(profileRes.data);
    setDocuments(docsRes.data || []);
    if (formRes.data?.form_data && typeof formRes.data.form_data === "object" && !Array.isArray(formRes.data.form_data)) {
      setFormData(formRes.data.form_data as Record<string, unknown>);
    }
    setSedes(sedesRes.data || []);
    setLoading(false);
  };

  const handleApproveDoc = async (docId: string) => {
    await supabase.from("documents").update({ status: "approved" }).eq("id", docId);
    toast({ title: "Documento aprobado" });
    loadData();
  };

  const handleRejectDoc = async () => {
    if (!docActionId || !docRejectReason.trim()) {
      toast({ title: "Error", description: "Debe indicar el motivo del rechazo.", variant: "destructive" });
      return;
    }
    await supabase.from("documents").update({ status: "rejected", rejection_reason: docRejectReason }).eq("id", docActionId);
    toast({ title: "Documento rechazado" });
    setShowDocReject(false);
    setDocActionId(null);
    setDocRejectReason("");
    loadData();
  };

  const handleApproveRequest = async () => {
    if (!selectedSede) {
      toast({ title: "Error", description: "Debe asignar una sede antes de aprobar.", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("profiles").update({
      status: "approved_documentation",
      sede_id: selectedSede,
      approved_documentation_at: new Date().toISOString(),
    }).eq("id", id!);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Log sede assignment
    await supabase.from("sede_change_history").insert({
      user_id: id!,
      admin_id: user!.id,
      nueva_sede_id: selectedSede,
      motivo: "Asignación inicial al aprobar documentación",
    });

    toast({ title: "Solicitud aprobada", description: "La documentación ha sido aprobada y la sede asignada." });
    setShowApprove(false);
    loadData();
  };

  const handleRejectRequest = async () => {
    if (!rejectReason.trim()) {
      toast({ title: "Error", description: "Debe indicar el motivo del rechazo.", variant: "destructive" });
      return;
    }

    await supabase.from("profiles").update({ status: "rejected" }).eq("id", id!);
    toast({ title: "Solicitud rechazada" });
    setShowReject(false);
    setRejectReason("");
    loadData();
  };

  if (loading || !profile) {
    return (
      <AdminLayout title="Cargando..." description="">
        <p className="text-muted-foreground">Cargando solicitud...</p>
      </AdminLayout>
    );
  }

  const assignedSede = sedes.find((s) => s.id === profile.sede_id);

  return (
    <AdminLayout
      title={`Revisión: ${profile.full_name || profile.email || "Sin nombre"}`}
      description={`Categoría: ${profile.category ? categoryLabels[profile.category] : "—"}`}
    >
      <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" /> Volver al listado
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-sans flex items-center gap-2">
                <User className="h-5 w-5" /> Información del Solicitante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm font-sans">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado</span>
                <Badge variant="outline">{statusLabels[profile.status]}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{profile.email}</span>
              </div>
              {profile.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Teléfono</span>
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{profile.phone}</span>
                </div>
              )}
              {assignedSede && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sede</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{assignedSede.nombre}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Registro</span>
                <span>{new Date(profile.created_at).toLocaleDateString("es-VE")}</span>
              </div>
            </CardContent>
          </Card>

          {/* Form Data */}
          {formData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-sans">Datos del Formulario</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm font-sans">
                {Object.entries(formData).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                    <span className="text-right max-w-[60%] truncate">{String(value)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {profile.status === "under_review" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-sans">Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" onClick={() => setShowApprove(true)}>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Aprobar Documentación
                </Button>
                <Button variant="destructive" className="w-full" onClick={() => setShowReject(true)}>
                  <XCircle className="h-4 w-4 mr-2" /> Rechazar Solicitud
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Documents */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-sans flex items-center gap-2">
                <FileText className="h-5 w-5" /> Documentos ({documents.length})
              </CardTitle>
              <CardDescription>Revise cada documento individualmente</CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No hay documentos cargados</p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => {
                    const st = docStatusLabels[doc.status] || docStatusLabels.pending;
                    return (
                      <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm font-sans capitalize">
                              {doc.document_type.replace(/_/g, " ")}
                            </p>
                            {doc.file_name && (
                              <p className="text-xs text-muted-foreground truncate">{doc.file_name}</p>
                            )}
                            {doc.rejection_reason && (
                              <p className="text-xs text-destructive mt-1">Motivo: {doc.rejection_reason}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className={`text-xs ${st.color}`}>
                            {st.label}
                          </Badge>

                          {doc.file_url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}

                          {doc.status === "approved" && (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          )}

                          {(doc.status === "uploaded" || doc.status === "under_review") && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleApproveDoc(doc.id)}>
                                <CheckCircle2 className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => { setDocActionId(doc.id); setShowDocReject(true); }}>
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApprove} onOpenChange={setShowApprove}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprobar Documentación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="font-sans">Asignar Sede *</Label>
              <Select value={selectedSede} onValueChange={setSelectedSede}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccione una sede" />
                </SelectTrigger>
                <SelectContent>
                  {sedes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nombre} – {s.estado_ubicacion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">La sede es obligatoria para activar al usuario.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprove(false)}>Cancelar</Button>
            <Button onClick={handleApproveRequest} disabled={!selectedSede}>Aprobar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Request Dialog */}
      <Dialog open={showReject} onOpenChange={setShowReject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Solicitud</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label className="font-sans">Motivo del Rechazo *</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Indique el motivo del rechazo..."
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReject(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRejectRequest} disabled={!rejectReason.trim()}>
              Rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Document Dialog */}
      <Dialog open={showDocReject} onOpenChange={setShowDocReject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Documento</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label className="font-sans">Motivo del Rechazo *</Label>
            <Textarea
              value={docRejectReason}
              onChange={(e) => setDocRejectReason(e.target.value)}
              placeholder="Indique el motivo del rechazo del documento..."
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDocReject(false); setDocActionId(null); }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRejectDoc} disabled={!docRejectReason.trim()}>
              Rechazar Documento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default RequestReview;
