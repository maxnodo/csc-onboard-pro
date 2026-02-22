import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import {
  Building2, LayoutDashboard, FileSearch, MapPin, LogOut, Users, ShieldCheck,
} from "lucide-react";

const navItems = [
  { title: "Solicitudes", url: "/admin", icon: LayoutDashboard },
  { title: "Aprobador Presencial", url: "/admin/approver", icon: ShieldCheck },
  { title: "Gestión de Sedes", url: "/admin/sedes", icon: MapPin },
];

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

const AdminLayout = ({ children, title, description }: AdminLayoutProps) => {
  const { signOut, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col shrink-0">
        <div className="p-5 border-b">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-lg font-bold text-primary font-sans">CSC Admin</h1>
              <p className="text-xs text-muted-foreground">Panel Administrativo</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === "/admin"}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-sans text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              activeClassName="bg-primary/10 text-primary font-medium"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t">
          <div className="px-3 py-2 text-xs text-muted-foreground font-sans mb-2 truncate">
            {profile?.email}
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" /> Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b bg-card px-8 py-5">
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          {description && <p className="text-sm text-muted-foreground font-sans mt-1">{description}</p>}
        </header>
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
