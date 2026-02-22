import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "./AdminLayout";
import { Plus, Edit, MapPin } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Sede = Tables<"sedes">;

const SedeManagement = () => {
  const { isSuperadmin } = useAuth();
  const { toast } = useToast();
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [editingSede, setEditingSede] = useState<Sede | null>(null);
  const [nombre, setNombre] = useState("");
  const [estado, setEstado] = useState("");
  const [activa, setActiva] = useState(true);

  useEffect(() => {
    loadSedes();
  }, []);

  const loadSedes = async () => {
    setLoading(true);
    const { data } = await supabase.from("sedes").select("*").order("nombre");
    setSedes(data || []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditingSede(null);
    setNombre("");
    setEstado("");
    setActiva(true);
    setShowDialog(true);
  };

  const openEdit = (sede: Sede) => {
    setEditingSede(sede);
    setNombre(sede.nombre);
    setEstado(sede.estado_ubicacion);
    setActiva(sede.activa);
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!nombre.trim() || !estado.trim()) {
      toast({ title: "Error", description: "Complete todos los campos.", variant: "destructive" });
      return;
    }

    if (editingSede) {
      const { error } = await supabase.from("sedes").update({
        nombre: nombre.trim(),
        estado_ubicacion: estado.trim(),
        activa,
      }).eq("id", editingSede.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Sede actualizada" });
    } else {
      const { error } = await supabase.from("sedes").insert({
        nombre: nombre.trim(),
        estado_ubicacion: estado.trim(),
        activa,
      });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Sede creada" });
    }

    setShowDialog(false);
    loadSedes();
  };

  const toggleActive = async (sede: Sede) => {
    await supabase.from("sedes").update({ activa: !sede.activa }).eq("id", sede.id);
    loadSedes();
  };

  return (
    <AdminLayout title="Gestión de Sedes" description="Administre las sedes de CSC">
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-muted-foreground font-sans">{sedes.length} sedes registradas</p>
        {isSuperadmin && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Nueva Sede
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Estado</TableHead>
                {isSuperadmin && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
              ) : sedes.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No hay sedes registradas</TableCell></TableRow>
              ) : (
                sedes.map((sede) => (
                  <TableRow key={sede.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium font-sans text-sm">{sede.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{sede.estado_ubicacion}</TableCell>
                    <TableCell>
                      <Badge variant={sede.activa ? "default" : "secondary"}>
                        {sede.activa ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    {isSuperadmin && (
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(sede)}>
                          <Edit className="h-3 w-3 mr-1" /> Editar
                        </Button>
                        <Button
                          variant={sede.activa ? "secondary" : "default"}
                          size="sm"
                          onClick={() => toggleActive(sede)}
                        >
                          {sede.activa ? "Desactivar" : "Activar"}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSede ? "Editar Sede" : "Nueva Sede"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="font-sans">Nombre de la Sede *</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="CSC Planta..." className="mt-1" />
            </div>
            <div>
              <Label className="font-sans">Ubicación (Estado) *</Label>
              <Input value={estado} onChange={(e) => setEstado(e.target.value)} placeholder="Estado..." className="mt-1" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={activa} onCheckedChange={setActiva} />
              <Label className="font-sans">Sede activa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingSede ? "Guardar Cambios" : "Crear Sede"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default SedeManagement;
