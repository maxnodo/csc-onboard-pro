import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { NavLink } from "@/components/NavLink";
import {
  Building2, LayoutDashboard, ShieldCheck, MapPin, LogOut, Home, PanelLeft, UserCircle,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const userNavItems = [
  { title: "Mi Solicitud", url: "/dashboard", icon: Home },
  { title: "Mi Perfil", url: "/profile", icon: UserCircle },
];

const adminNavItems = [
  { title: "Solicitudes", url: "/admin", icon: LayoutDashboard },
  { title: "Aprobador Presencial", url: "/admin/approver", icon: ShieldCheck },
  { title: "Gestión de Sedes", url: "/admin/sedes", icon: MapPin },
];

const AppSidebar = () => {
  const { signOut, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary shrink-0" />
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold text-primary font-sans truncate">
                {isAdmin ? "CSC Admin" : "CSC"}
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                {isAdmin ? "Panel Administrativo" : "Onboarding Documental"}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel>
              {isAdmin ? "Administración" : "Navegación"}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin" || item.url === "/dashboard"}
                      className="flex items-center gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {!isCollapsed && (
          <div className="px-2 py-1 text-xs text-sidebar-foreground/50 font-sans truncate">
            {profile?.email}
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip="Cerrar Sesión" className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent">
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
};

export default AppSidebar;
