import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import OnboardingLayout from "./OnboardingLayout";
import { ArrowLeft, Send, Shield, FileCheck } from "lucide-react";

const Step3Confirmation = () => {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptDeclaration, setAcceptDeclaration] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!acceptTerms || !acceptDeclaration) {
      toast({
        title: "Aceptación requerida",
        description: "Debe aceptar los términos y la declaración jurada para continuar.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: "under_review", onboarding_step: 4 })
        .eq("id", user!.id);

      if (error) throw error;

      await refreshProfile();
      toast({
        title: "Solicitud enviada",
        description: "Su solicitud ha sido enviada para revisión. Le notificaremos por correo electrónico.",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OnboardingLayout
      currentStep={3}
      title="Etapa 3 – Declaraciones y Confirmación"
      description="Revise y confirme su solicitud"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-sans">
              <Shield className="h-5 w-5 text-primary" />
              Términos y Condiciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4 mb-4 text-sm text-muted-foreground font-sans max-h-48 overflow-y-auto">
              <p className="mb-2">Al utilizar el Sistema de Onboarding Documental de la Corporación Socialista de Cemento (CSC), usted acepta:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Proporcionar información veraz y completa en todos los formularios.</li>
                <li>Cargar documentos auténticos y vigentes.</li>
                <li>Someterse al proceso de verificación documental y presencial establecido.</li>
                <li>Cumplir con las normativas y regulaciones aplicables.</li>
                <li>Autorizar a CSC para verificar la autenticidad de los documentos presentados.</li>
                <li>Aceptar que la aprobación está sujeta a la revisión satisfactoria de toda la documentación.</li>
              </ul>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(c) => setAcceptTerms(c === true)}
              />
              <Label htmlFor="terms" className="text-sm font-sans leading-relaxed cursor-pointer">
                He leído y acepto los Términos y Condiciones del Sistema de Onboarding Documental de CSC.
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-sans">
              <FileCheck className="h-5 w-5 text-primary" />
              Declaración Jurada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4 mb-4 text-sm text-muted-foreground font-sans">
              <p>
                Declaro bajo juramento que toda la información proporcionada y los documentos
                cargados en este sistema son verídicos, auténticos y se encuentran vigentes.
                Comprendo que cualquier falsedad u omisión podrá resultar en el rechazo de mi
                solicitud y las consecuencias legales correspondientes.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="declaration"
                checked={acceptDeclaration}
                onCheckedChange={(c) => setAcceptDeclaration(c === true)}
              />
              <Label htmlFor="declaration" className="text-sm font-sans leading-relaxed cursor-pointer">
                Declaro bajo juramento que la información y documentación proporcionada es veraz y auténtica.
              </Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between pt-6 border-t">
          <Button variant="outline" onClick={() => navigate("/onboarding/step-2")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Anterior
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!acceptTerms || !acceptDeclaration || submitting}
          >
            <Send className="h-4 w-4 mr-2" />
            {submitting ? "Enviando..." : "Enviar Solicitud"}
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default Step3Confirmation;
