import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { categoryLabels, categoryDescriptions } from "@/lib/document-matrix";
import { Building2, Store, HardHat, Rocket, Landmark, ArrowLeft, Package, Wrench, Box, Factory, Truck } from "lucide-react";
import type { Enums } from "@/integrations/supabase/types";

const iconMap: Record<string, React.ReactNode> = {
  distribuidor: <Store className="h-10 w-10" />,
  constructor: <HardHat className="h-10 w-10" />,
  emprendedor: <Rocket className="h-10 w-10" />,
  alcaldia: <Landmark className="h-10 w-10" />,
};

const subcategoriasDistribuidor = [
  { key: "distribuidor_minorista", label: "Distribuidor Minorista", icon: <Package className="h-10 w-10" />, description: "Distribución al menor de materiales de construcción." },
  { key: "ferreteria", label: "Ferretería", icon: <Wrench className="h-10 w-10" />, description: "Venta de herramientas, tornillería y artículos ferreteros." },
  { key: "bloquera", label: "Bloquera", icon: <Box className="h-10 w-10" />, description: "Fabricación y venta de bloques y elementos prefabricados." },
  { key: "transformador", label: "Transformador", icon: <Factory className="h-10 w-10" />, description: "Transformación de materias primas en productos terminados." },
  { key: "concretos_premezclados", label: "Concretos Premezclados / Firmas Personales", icon: <Truck className="h-10 w-10" />, description: "Producción y despacho de concreto premezclado o firmas personales." },
];

const CategorySelection = () => {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showSubcategoria, setShowSubcategoria] = useState(false);

  const handleSelect = async (category: Enums<"user_category">) => {
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ category, onboarding_step: 1 })
      .eq("id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    await refreshProfile();
    navigate("/onboarding/step-1");
  };

  const handleCategoryClick = (cat: Enums<"user_category">) => {
    if (cat === "distribuidor") {
      setShowSubcategoria(true);
    } else {
      handleSelect(cat);
    }
  };

  const handleSubcategoriaSelect = async (subcategoria: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("form_data")
      .upsert(
        {
          user_id: user.id,
          category: "distribuidor" as Enums<"user_category">,
          form_data: { subcategoria_distribuidor: subcategoria },
        },
        { onConflict: "user_id,category" }
      );

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    await handleSelect("distribuidor");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-primary font-sans">CSC</h1>
            <p className="text-xs text-muted-foreground">Sistema de Onboarding Documental</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-4xl">
        {!showSubcategoria ? (
          <>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-foreground mb-3">Seleccione su Categoría</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto font-sans">
                Seleccione la categoría que mejor describe su actividad. Esto determinará los documentos requeridos para completar su registro.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(Object.keys(categoryLabels) as Enums<"user_category">[]).map((cat) => (
                <Card
                  key={cat}
                  className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 hover:-translate-y-1"
                  onClick={() => handleCategoryClick(cat)}
                >
                  <CardHeader className="flex flex-row items-start gap-4 pb-3">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      {iconMap[cat]}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg font-sans">{categoryLabels[cat]}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {categoryDescriptions[cat]}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => setShowSubcategoria(false)}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a categorías
              </Button>
            </div>

            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-foreground mb-3">Seleccione el Tipo de Distribuidor</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto font-sans">
                Indique el tipo de distribución que realiza. Todos los tipos requieren la misma documentación.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {subcategoriasDistribuidor.map((sub) => (
                <Card
                  key={sub.key}
                  className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 hover:-translate-y-1"
                  onClick={() => handleSubcategoriaSelect(sub.label)}
                >
                  <CardHeader className="flex flex-row items-start gap-4 pb-3">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      {sub.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg font-sans">{sub.label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {sub.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default CategorySelection;
