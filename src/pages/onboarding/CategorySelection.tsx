import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { categoryLabels, categoryDescriptions } from "@/lib/document-matrix";
import { Building2, Store, HardHat, Rocket, Landmark } from "lucide-react";
import type { Enums } from "@/integrations/supabase/types";

const iconMap: Record<string, React.ReactNode> = {
  distribuidor: <Store className="h-10 w-10" />,
  constructor: <HardHat className="h-10 w-10" />,
  emprendedor: <Rocket className="h-10 w-10" />,
  alcaldia: <Landmark className="h-10 w-10" />,
};

const CategorySelection = () => {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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
              onClick={() => handleSelect(cat)}
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
      </main>
    </div>
  );
};

export default CategorySelection;
