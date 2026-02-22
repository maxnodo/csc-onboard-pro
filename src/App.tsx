import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CategorySelection from "./pages/onboarding/CategorySelection";
import Step1GeneralInfo from "./pages/onboarding/Step1GeneralInfo";
import Step2Documentation from "./pages/onboarding/Step2Documentation";
import Step3Confirmation from "./pages/onboarding/Step3Confirmation";
import AdminDashboard from "./pages/admin/AdminDashboard";
import RequestReview from "./pages/admin/RequestReview";
import SedeManagement from "./pages/admin/SedeManagement";
import ApproverPanel from "./pages/admin/ApproverPanel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Cargando...</p></div>;
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading, isAdmin } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Cargando...</p></div>;
  if (!session) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const OnboardingRouter = () => {
  const { profile, loading, isAdmin } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Cargando...</p></div>;
  if (!profile) return null;

  // Admins go to admin panel
  if (isAdmin) return <Navigate to="/admin" replace />;

  if (profile.status === "pending_verification") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Verifique su Correo Electrónico</h2>
          <p className="text-muted-foreground font-sans">Hemos enviado un enlace de verificación a su correo electrónico. Por favor, revise su bandeja de entrada y confirme su cuenta para continuar.</p>
        </div>
      </div>
    );
  }

  if (profile.status === "onboarding_started") {
    if (!profile.category) return <Navigate to="/onboarding/category" replace />;
    if (profile.onboarding_step <= 1) return <Navigate to="/onboarding/step-1" replace />;
    if (profile.onboarding_step === 2) return <Navigate to="/onboarding/step-2" replace />;
    if (profile.onboarding_step === 3) return <Navigate to="/onboarding/step-3" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<Auth />} />
    <Route path="/" element={<ProtectedRoute><OnboardingRouter /></ProtectedRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/onboarding/category" element={<ProtectedRoute><CategorySelection /></ProtectedRoute>} />
    <Route path="/onboarding/step-1" element={<ProtectedRoute><Step1GeneralInfo /></ProtectedRoute>} />
    <Route path="/onboarding/step-2" element={<ProtectedRoute><Step2Documentation /></ProtectedRoute>} />
    <Route path="/onboarding/step-3" element={<ProtectedRoute><Step3Confirmation /></ProtectedRoute>} />
    {/* Admin routes */}
    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
    <Route path="/admin/request/:id" element={<AdminRoute><RequestReview /></AdminRoute>} />
    <Route path="/admin/approver" element={<AdminRoute><ApproverPanel /></AdminRoute>} />
    <Route path="/admin/sedes" element={<AdminRoute><SedeManagement /></AdminRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
