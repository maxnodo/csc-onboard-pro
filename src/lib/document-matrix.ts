export type DocumentRequirementType = "FILE_UPLOAD" | "FORM_FIELD" | "FORM_GENERATED_FILE_UPLOAD";

export interface DocumentRequirement {
  key: string;
  label: string;
  type: DocumentRequirementType;
  multiple?: boolean;
  conditional?: boolean;
  conditionalLabel?: string;
}

export interface FormFieldDefinition {
  key: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "date" | "number";
  required: boolean;
  placeholder?: string;
}

function dr(key: string, label: string, type: DocumentRequirementType, opts?: { multiple?: boolean; conditional?: boolean; conditionalLabel?: string }): DocumentRequirement {
  return { key, label, type, ...opts };
}

function ff(key: string, label: string, type: FormFieldDefinition["type"], required: boolean, placeholder?: string): FormFieldDefinition {
  return { key, label, type, required, placeholder };
}

const gen = (key: string, label: string) => dr(key, label, "FORM_GENERATED_FILE_UPLOAD");
const file = (key: string, label: string, opts?: { multiple?: boolean; conditional?: boolean; conditionalLabel?: string }) => dr(key, label, "FILE_UPLOAD", opts);

const commonGenerated: DocumentRequirement[] = [
  gen("hoja_consignacion", "Hoja de Consignación"),
  gen("carta_solicitud", "Carta de Solicitud"),
];

export const documentMatrixByCategory: Record<string, DocumentRequirement[]> = {
  distribuidor: [
    ...commonGenerated,
    file("acta_constitutiva", "Acta Constitutiva / Registro Mercantil"),
    file("declaracion_islr_iva", "Declaración ISLR / IVA"),
    file("acta_asamblea", "Última Acta de Asamblea", { conditional: true, conditionalLabel: "Si aplica" }),
    file("cedula_accionistas", "Cédula de Identidad de los Accionistas"),
    file("rif_empresa", "RIF Empresa"),
    file("rif_accionistas", "RIF Accionistas"),
    file("registro_fotografico", "Registro Fotográfico (mín. 4 fotos a color)", { multiple: true }),
    file("referencias_comerciales", "Referencias Comerciales — 3 originales, vigencia ≤ 90 días", { multiple: true }),
    file("referencia_bancaria", "Referencia Bancaria — 1 original, vigencia ≤ 30 días"),
  ],
  constructor: [
    ...commonGenerated,
    file("acta_constitutiva", "Acta Constitutiva / Registro Mercantil"),
    file("declaracion_islr_iva", "Declaración ISLR / IVA"),
    file("acta_asamblea", "Última Acta de Asamblea", { conditional: true, conditionalLabel: "Si aplica" }),
    file("cedula_accionistas", "Cédula de Identidad de los Accionistas"),
    file("rif_empresa_accionistas", "RIF Empresa y Accionistas"),
    file("registro_fotografico", "Registro Fotográfico (mín. 4 fotos a color)", { multiple: true }),
    file("memoria_descriptiva", "Memoria Descriptiva (firmada por Ingeniero o Arquitecto)"),
    file("contrato_obra", "Contrato de Obra"),
    file("acta_prorroga", "Acta de Prórroga", { conditional: true, conditionalLabel: "Si aplica" }),
    file("referencias_comerciales", "Referencias Comerciales — 3 originales, vigencia ≤ 90 días", { multiple: true }),
    file("referencia_bancaria", "Referencia Bancaria — 1 original, vigencia ≤ 30 días"),
  ],
  emprendedor: [
    ...commonGenerated,
    file("registro_emprendedor", "Registro de Emprendedor"),
    file("cedula_identidad", "Cédula de Identidad"),
    file("rif", "RIF"),
    file("registro_fotografico", "Registro Fotográfico (mín. 4 fotos a color)", { multiple: true }),
    file("registro_ivss", "Registro del Emprendimiento en el IVSS"),
    file("registro_inces", "Registro del Emprendimiento en el INCES"),
    file("registro_faov", "Registro del Emprendimiento en el FAOV"),
  ],
  alcaldia: [
    ...commonGenerated,
    file("gaceta_oficial", "Gaceta Oficial de la Alcaldía o Gobernación"),
    file("nombramiento_autoridad", "Gaceta de Nombramiento del Alcalde o Gobernador"),
    file("cedula_autoridad", "Cédula de Identidad del Alcalde o Responsable"),
    file("rif_institucional", "RIF de la Alcaldía/Gobernación y del Alcalde/Gobernador"),
    file("carnet_patria", "Carnet de la Patria", { conditional: true, conditionalLabel: "Si requerido" }),
  ],
};

export const formFieldsByCategory: Record<string, FormFieldDefinition[]> = {
  distribuidor: [
    ff("razon_social", "Razón Social", "text", true),
    ff("rif", "RIF", "text", true, "J-12345678-9"),
    ff("direccion_fiscal", "Dirección Fiscal", "textarea", true),
    ff("representante_legal", "Representante Legal", "text", true),
    ff("telefono", "Teléfono", "tel", true),
    ff("correo", "Correo Electrónico", "email", true),
  ],
  constructor: [
    ff("razon_social", "Razón Social", "text", true),
    ff("rif", "RIF", "text", true, "J-12345678-9"),
    ff("direccion_fiscal", "Dirección Fiscal", "textarea", true),
    ff("representante_legal", "Representante Legal", "text", true),
    ff("telefono", "Teléfono", "tel", true),
    ff("correo", "Correo Electrónico", "email", true),
    ff("nombre_obra", "Nombre de la Obra", "text", true),
    ff("ubicacion_obra", "Ubicación de la Obra", "text", true),
    ff("monto_estimado", "Monto Estimado", "number", true),
    ff("fecha_inicio", "Fecha de Inicio", "date", true),
    ff("fecha_culminacion", "Fecha de Culminación", "date", true),
  ],
  emprendedor: [
    ff("nombre_completo", "Nombre Completo", "text", true),
    ff("cedula", "Número de Cédula", "text", true),
    ff("rif", "RIF", "text", true, "V-12345678-9"),
    ff("direccion", "Dirección", "textarea", true),
    ff("telefono", "Teléfono", "tel", true),
    ff("correo", "Correo Electrónico", "email", true),
    ff("actividad_economica", "Actividad Económica", "text", true),
  ],
  alcaldia: [
    ff("nombre_ente", "Nombre del Ente", "text", true),
    ff("rif_institucional", "RIF Institucional", "text", true, "G-20012345-0"),
    ff("estado", "Estado", "text", true),
    ff("municipio", "Municipio", "text", true),
    ff("direccion_administrativa", "Dirección Administrativa", "textarea", true),
    ff("telefono_institucional", "Teléfono Institucional", "tel", true),
    ff("correo_institucional", "Correo Institucional", "email", true),
  ],
};

export const categoryLabels: Record<string, string> = {
  distribuidor: "Distribuidor / Ferretería / Bloquera / Transformador",
  constructor: "Constructor",
  emprendedor: "Emprendedor",
  alcaldia: "Alcaldía / Gobernación",
};

export const categoryDescriptions: Record<string, string> = {
  distribuidor: "Empresas dedicadas a la distribución, venta o transformación de productos de cemento.",
  constructor: "Empresas constructoras con proyectos de obra activos o planificados.",
  emprendedor: "Emprendedores individuales con actividad económica relacionada al sector.",
  alcaldia: "Entes gubernamentales municipales o regionales.",
};
