import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import AdminLayout from "./AdminLayout";
import { categoryLabels } from "@/lib/document-matrix";
import { Search, UserCheck, UserX, ShieldCheck, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Sede = Tables<"sedes">;

const ApproverPanel = () => {
  const { user, isSuperadmin } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Activation dialog
  const [activateDialog, setActivateDialog] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [identityVerified, setIdentityVerified] = useState(false);
  const [termsVerified, setTermsVerified] = useState(false);
  const [activating, setActivating] = useState(false);

  // Rejection dialog
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [returnToReview, setReturnToReview] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [profilesRes, sedesRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("status", "approved_documentation")
        .order("approved_documentation_at", { ascending: true }),
      supabase.from("sedes").select("*").eq("activa", true),
    ]);
    setProfiles(profilesRes.data || []);
    setSedes(sedesRes.data || []);
    setLoading(false);
  };

  const getSedeNameById = (sedeId: string | null) => {
    if (!sedeId) return "Sin asignar";
    const sede = sedes.find((s) => s.id === sedeId);
    return sede ? sede.nombre : "Desconocida";
  };

  const getDaysRemaining = (approvedAt: string | null) => {
    if (!approvedAt) return null;
    const approved = new Date(approvedAt);
    const expires = new Date(approved.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diff = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const filtered = profiles.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.email?.toLowerCase().includes(term) ||
      p.full_name?.toLowerCase().includes(term)
    );
  });

  const openActivateDialog = (profile: Profile) => {
    setSelectedProfile(profile);
    setIdentityVerified(false);
    setTermsVerified(false);
    setActivateDialog(true);
  };

  const openRejectDialog = (profile: Profile) => {
    setSelectedProfile(profile);
    setRejectReason("");
    setReturnToReview(false);
    setRejectDialog(true);
  };

  const handleActivate = async () => {
    if (!selectedProfile || !user) return;
    setActivating(true);
    const { error } = await supabase
      .from("profiles")
      .update({ status: "active_final" as any })
      .eq("id", selectedProfile.id);

    if (error) {
      toast({ title: "Error", description: "No se pudo activar al usuario.", variant: "destructive" });
    } else {
      toast({ title: "Usuario Activado", description: `${selectedProfile.full_name || selectedProfile.email} ha sido activado exitosamente.` });
      setProfiles((prev) => prev.filter((p) => p.id !== selectedProfile.id));
    }
    setActivating(false);
    setActivateDialog(false);
  };

  const handleReject = async () => {
    if (!selectedProfile || !user || !rejectReason.trim()) return;
    setRejecting(true);

    const newStatus = returnToReview ? "under_review" : "rejected_presencial";

    const { error } = await supabase
      .from("profiles")
      .update({ status: newStatus as any })
      .eq("id", selectedProfile.id);

    if (error) {
      toast({ title: "Error", description: "No se pudo procesar el rechazo.", variant: "destructive" });
    } else {
      toast({
        title: returnToReview ? "Devuelto a Revisión" : "Rechazado Presencialmente",
        description: `Motivo: ${rejectReason}`,
      });
      setProfiles((prev) => prev.filter((p) => p.id !== selectedProfile.id));
    }
    setRejecting(false);
    setRejectDialog(false);
  };

  return (
    <AdminLayout title="Panel del Aprobador" description="Verificación presencial y activación final de usuarios">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-2 rounded-lg bg-muted text-success"><ShieldCheck className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold">{profiles.length}</p>
              <p className="text-xs text-muted-foreground font-sans">Pendientes de Verificación</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-2 rounded-lg bg-muted text-warning"><Clock className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold">
                {profiles.filter((p) => {
                  const days = getDaysRemaining(p.approved_documentation_at);
                  return days !== null && days <= 7;
                }).length}
              </p>
              <p className="text-xs text-muted-foreground font-sans">Por Vencer (≤7 días)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-2 rounded-lg bg-muted text-destructive"><AlertTriangle className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold">
                {profiles.filter((p) => {
                  const days = getDaysRemaining(p.approved_documentation_at);
                  return days !== null && days <= 0;
                }).length}
              </p>
              <p className="text-xs text-muted-foreground font-sans">Vencidos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Solicitante</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Sede Asignada</TableHead>
                <TableHead>Días Restantes</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No hay usuarios pendientes de verificación presencial</TableCell></TableRow>
              ) : (
                filtered.map((p) => {
                  const days = getDaysRemaining(p.approved_documentation_at);
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <p className="font-medium font-sans text-sm">{p.full_name || "Sin nombre"}</p>
                        <p className="text-xs text-muted-foreground">{p.email}</p>
                      </TableCell>
                      <TableCell className="text-sm font-sans">
                        {p.category ? categoryLabels[p.category] : "—"}
                      </TableCell>
                      <TableCell className="text-sm font-sans">
                        {getSedeNameById(p.sede_id)}
                      </TableCell>
                      <TableCell>
                        {days !== null ? (
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              days <= 0
                                ? "bg-destructive/10 text-destructive"
                                : days <= 7
                                ? "bg-warning/10 text-warning"
                                : "bg-success/10 text-success"
                            }`}
                          >
                            {days <= 0 ? "Vencido" : `${days} días`}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" onClick={() => openActivateDialog(p)} className="bg-success hover:bg-success/90 text-success-foreground">
                          <UserCheck className="h-4 w-4 mr-1" /> Activar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => openRejectDialog(p)}>
                          <UserX className="h-4 w-4 mr-1" /> Rechazar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Activation Dialog */}
      <Dialog open={activateDialog} onOpenChange={setActivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activación Final</DialogTitle>
            <DialogDescription>
              Confirme la verificación presencial de <strong>{selectedProfile?.full_name || selectedProfile?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="identity"
                checked={identityVerified}
                onCheckedChange={(v) => setIdentityVerified(v === true)}
              />
              <Label htmlFor="identity" className="text-sm font-sans leading-5">
                He verificado la identidad del solicitante con documento oficial (cédula de identidad o pasaporte)
              </Label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={termsVerified}
                onCheckedChange={(v) => setTermsVerified(v === true)}
              />
              <Label htmlFor="terms" className="text-sm font-sans leading-5">
                El solicitante ha firmado los Términos y Condiciones de uso en presencia del aprobador
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivateDialog(false)}>Cancelar</Button>
            <Button
              disabled={!identityVerified || !termsVerified || activating}
              onClick={handleActivate}
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              {activating ? "Activando..." : "Confirmar Activación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazo Presencial</DialogTitle>
            <DialogDescription>
              Indique el motivo del rechazo de <strong>{selectedProfile?.full_name || selectedProfile?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-sans">Motivo del rechazo *</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Indique el motivo del rechazo presencial..."
                className="mt-1"
              />
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="return-review"
                checked={returnToReview}
                onCheckedChange={(v) => setReturnToReview(v === true)}
              />
              <Label htmlFor="return-review" className="text-sm font-sans leading-5">
                Devolver a revisión documental (en vez de rechazar definitivamente)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || rejecting}
              onClick={handleReject}
            >
              {rejecting ? "Procesando..." : returnToReview ? "Devolver a Revisión" : "Confirmar Rechazo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ApproverPanel;
