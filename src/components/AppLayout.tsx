import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

const AppLayout = ({ children, title, description }: AppLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="border-b bg-card px-6 py-4 flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h2 className="text-2xl font-bold text-foreground">{title}</h2>
              {description && (
                <p className="text-sm text-muted-foreground font-sans mt-0.5">{description}</p>
              )}
            </div>
          </header>
          <main className="flex-1 p-6 md:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
