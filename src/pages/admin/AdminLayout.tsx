import { ReactNode } from "react";
import AppLayout from "@/components/AppLayout";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

const AdminLayout = ({ children, title, description }: AdminLayoutProps) => {
  return (
    <AppLayout title={title} description={description}>
      {children}
    </AppLayout>
  );
};

export default AdminLayout;
