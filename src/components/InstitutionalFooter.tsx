import cintillo from "@/assets/cintillo-header.png";

const InstitutionalFooter = () => {
  return (
    <footer className="border-t bg-white py-4 px-6">
      <div className="flex flex-col items-center gap-2">
        <img
          src={cintillo}
          alt="Cintillo institucional - Corporación Socialista de Cemento"
          className="max-h-10 w-auto object-contain"
        />
        <p className="text-[10px] text-muted-foreground">
          © {new Date().getFullYear()} Corporación Socialista de Cemento, S.A. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};

export default InstitutionalFooter;
