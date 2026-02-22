import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { Building2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep: number;
  title: string;
  description?: string;
}

const steps = [
  { number: 1, label: "Información General" },
  { number: 2, label: "Documentación" },
  { number: 3, label: "Confirmación" },
];

const OnboardingLayout = ({ children, currentStep, title, description }: OnboardingLayoutProps) => {
  const progressPercent = ((currentStep - 1) / 3) * 100 + (currentStep <= 3 ? 33.3 * 0.5 : 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-primary font-sans">CSC</h1>
              <p className="text-xs text-muted-foreground">Onboarding Documental</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground font-sans">
            Progreso: {Math.round(progressPercent)}%
          </div>
        </div>
        <div className="container mx-auto px-6 pb-4">
          <Progress value={progressPercent} className="h-2" />
        </div>
      </header>

      {/* Step indicator */}
      <div className="border-b bg-card/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-center gap-4 md:gap-8">
            {steps.map((step, i) => (
              <div key={step.number} className="flex items-center gap-2">
                {i > 0 && <div className={cn("hidden md:block w-12 h-px", currentStep > step.number - 1 ? "bg-primary" : "bg-border")} />}
                <div className={cn(
                  "flex items-center gap-2 font-sans text-sm",
                  currentStep === step.number ? "text-primary font-semibold" :
                  currentStep > step.number ? "text-primary/60" : "text-muted-foreground"
                )}>
                  {currentStep > step.number ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <span className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      currentStep === step.number ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {step.number}
                    </span>
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 py-8 max-w-3xl">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
          {description && <p className="text-muted-foreground font-sans">{description}</p>}
        </div>
        {children}
      </main>
    </div>
  );
};

export default OnboardingLayout;
