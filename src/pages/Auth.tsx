import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building2, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else {
        if (password !== confirmPassword) {
          toast({ title: "Error", description: "Las contraseñas no coinciden.", variant: "destructive" });
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          toast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres.", variant: "destructive" });
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({
          title: "Registro exitoso",
          description: "Revise su correo electrónico para verificar su cuenta.",
        });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_40%,hsl(38,70%,50%)_0%,transparent_50%)]" />
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,hsl(215,60%,40%)_0%,transparent_50%)]" />
        </div>
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 border border-primary-foreground/30 rounded-lg rotate-12" />
          <div className="absolute bottom-20 right-16 w-24 h-24 border border-primary-foreground/20 rounded-full" />
          <div className="absolute top-1/3 right-10 w-16 h-16 border border-primary-foreground/20 rounded-md -rotate-6" />
        </div>
        <div className="relative z-10 text-primary-foreground px-12 max-w-lg">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-primary-foreground/10 rounded-xl backdrop-blur-sm border border-primary-foreground/10">
              <Building2 className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">CSC</h1>
              <p className="text-sm opacity-70 font-sans tracking-wide uppercase">Corporación Socialista de Cemento</p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold leading-snug">
              Sistema de Registro y<br />Onboarding Documental
            </h2>
            <p className="text-primary-foreground/70 leading-relaxed font-sans">
              Plataforma integral para el registro carga documental y validación de distribuidores constructores emprendedores e instituciones públicas
            </p>

          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <Building2 className="h-10 w-10 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-primary">CSC</h1>
              <p className="text-xs text-muted-foreground">Corporación Socialista de Cemento</p>
            </div>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">
                {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
              </CardTitle>
              <CardDescription>
                {isLogin
                  ? "Ingrese sus credenciales para acceder al sistema"
                  : "Complete los datos para registrarse en el sistema"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Procesando..." : isLogin ? "Iniciar Sesión" : "Registrarse"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-primary hover:underline font-sans"
                >
                  {isLogin ? "¿No tiene cuenta? Regístrese aquí" : "¿Ya tiene cuenta? Inicie sesión"}
                </button>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-center text-muted-foreground mt-6 font-sans">
            © {new Date().getFullYear()} Corporación Socialista de Cemento. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
