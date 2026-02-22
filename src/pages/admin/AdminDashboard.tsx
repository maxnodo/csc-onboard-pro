import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import AdminLayout from "./AdminLayout";
import { categoryLabels } from "@/lib/document-matrix";
import { Search, Eye, Users, Clock, CheckCircle2, XCircle, FileSearch, ChevronLeft, ChevronRight } from "lucide-react";
import type { Tables, Enums } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

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

const statusColors: Record<string, string> = {
  pending_verification: "bg-muted text-muted-foreground",
  onboarding_started: "bg-primary/10 text-primary",
  under_review: "bg-warning/10 text-warning",
  approved_documentation: "bg-success/10 text-success",
  expired_documentation: "bg-warning/10 text-warning",
  rejected: "bg-destructive/10 text-destructive",
  rejected_presencial: "bg-destructive/10 text-destructive",
  active_final: "bg-success/10 text-success",
};

const PAGE_SIZE = 10;

const AdminDashboard = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileImages, setProfileImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    
    const [profilesRes, rolesRes, formDataRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id").in("role", ["admin", "superadmin", "approver"]),
      supabase.from("form_data").select("user_id, form_data"),
    ]);

    const adminUserIds = new Set((rolesRes.data || []).map((r) => r.user_id));
    const nonAdminProfiles = (profilesRes.data || []).filter((p) => !adminUserIds.has(p.id));

    // Build image map from form_data
    const imgMap: Record<string, string> = {};
    (formDataRes.data || []).forEach((fd) => {
      const data = fd.form_data as Record<string, unknown> | null;
      if (data && typeof data === "object" && typeof data._profile_image_url === "string") {
        imgMap[fd.user_id] = data._profile_image_url;
      }
    });

    setProfileImages(imgMap);
    setProfiles(nonAdminProfiles);
    setLoading(false);
  };

  const filtered = profiles.filter((p) => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (filterCategory !== "all" && p.category !== filterCategory) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        p.email?.toLowerCase().includes(term) ||
        p.full_name?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedPage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((paginatedPage - 1) * PAGE_SIZE, paginatedPage * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [filterStatus, filterCategory, searchTerm]);

  const countByStatus = (status: string) => profiles.filter((p) => p.status === status).length;

  const statCards = [
    { label: "En Revisión", count: countByStatus("under_review"), icon: <Clock className="h-5 w-5" />, color: "text-warning" },
    { label: "Aprobados", count: countByStatus("approved_documentation"), icon: <CheckCircle2 className="h-5 w-5" />, color: "text-success" },
    { label: "Rechazados", count: countByStatus("rejected"), icon: <XCircle className="h-5 w-5" />, color: "text-destructive" },
    { label: "Activos", count: countByStatus("active_final"), icon: <CheckCircle2 className="h-5 w-5" />, color: "text-success" },
  ];

  return (
    <AdminLayout title="Panel de Solicitudes" description="Gestione las solicitudes de onboarding de los usuarios">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 py-4">
              <div className={`p-2 rounded-lg bg-muted ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-2xl font-bold">{s.count}</p>
                <p className="text-xs text-muted-foreground font-sans">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o correo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(statusLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {Object.entries(categoryLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No se encontraron solicitudes</TableCell></TableRow>
              ) : (
                paginated.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {profileImages[p.id] && <AvatarImage src={profileImages[p.id]} alt={p.full_name || ""} />}
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {(p.full_name || "")
                              .split(" ")
                              .filter(Boolean)
                              .map((w) => w[0].toUpperCase())
                              .slice(0, 2)
                              .join("") || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium font-sans text-sm">{p.full_name || "Sin nombre"}</p>
                          <p className="text-xs text-muted-foreground">{p.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-sans">
                        {p.category ? categoryLabels[p.category] : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${statusColors[p.status] || ""}`}>
                        {statusLabels[p.status] || p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("es-VE")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/request/${p.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> Revisar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Mostrando {(paginatedPage - 1) * PAGE_SIZE + 1}–{Math.min(paginatedPage * PAGE_SIZE, filtered.length)} de {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={paginatedPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">{paginatedPage} / {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={paginatedPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminDashboard;
