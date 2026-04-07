import { jsPDF } from "jspdf";
import type { DocumentRequirement } from "./document-matrix";

interface HojaData {
  razonSocial: string;
  rif: string;
  representanteLegal: string;
  cedulaRepresentante: string;
  celular: string;
  telefonoFijo: string;
  correo: string;
  requirements: DocumentRequirement[];
  uploadedDocTypes: Set<string>; // doc types with status uploaded or approved
  category: string;
  categoryLabel: string;
}

export async function generateHojaConsignacion(data: HojaData) {
  const [
    { robotoRegularBase64 },
    { robotoBoldBase64 },
    { robotoItalicBase64 },
  ] = await Promise.all([
    import("./fonts/roboto-regular"),
    import("./fonts/roboto-bold"),
    import("./fonts/roboto-italic"),
  ]);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });

  // Register Roboto fonts
  doc.addFileToVFS("Roboto-Regular.ttf", robotoRegularBase64);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFileToVFS("Roboto-Bold.ttf", robotoBoldBase64);
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
  doc.addFileToVFS("Roboto-Italic.ttf", robotoItalicBase64);
  doc.addFont("Roboto-Italic.ttf", "Roboto", "italic");

  const pageW = doc.internal.pageSize.getWidth();
  const marginL = 15;
  const marginR = 15;
  const contentW = pageW - marginL - marginR;
  let y = 15;

  const lineH = 5;
  const sectionGap = 4;

  // --- Helpers ---
  const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.line(x1, y1, x2, y2);
  };

  const drawBox = (x: number, yPos: number, w: number, h: number) => {
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(x, yPos, w, h);
  };

  const sectionTitle = (title: string) => {
    doc.setFont("Roboto", "bold");
    doc.setFontSize(8);
    doc.setFillColor(220, 220, 220);
    doc.rect(marginL, y, contentW, 6, "F");
    drawBox(marginL, y, contentW, 6);
    doc.text(title, marginL + 2, y + 4);
    y += 6;
  };

  const fieldRow = (fields: { label: string; value: string; width: number }[], rowH = 8) => {
    let x = marginL;
    for (const f of fields) {
      const w = f.width * contentW;
      drawBox(x, y, w, rowH);
      doc.setFont("Roboto", "bold");
      doc.setFontSize(6.5);
      doc.text(f.label, x + 1.5, y + 3);
      doc.setFont("Roboto", "normal");
      doc.setFontSize(8);
      doc.text(f.value || "", x + 1.5, y + 6.5);
      x += w;
    }
    y += rowH;
  };

  // ===================== HEADER =====================
  doc.setFont("Roboto", "bold");
  doc.setFontSize(11);
  doc.text("CORPORACIÓN SOCIALISTA DEL CEMENTO, S.A.", pageW / 2, y, { align: "center" });
  y += 5;

  doc.setFontSize(9);
  doc.text("PLANILLA DE CONSIGNACIÓN DE DOCUMENTOS", pageW / 2, y, { align: "center" });
  y += 7;

  // Date fields row
  const now = new Date();
  const dateFields = [
    { label: "Ciudad:", value: "", width: 0.4 },
    { label: "Día:", value: String(now.getDate()), width: 0.2 },
    { label: "Mes:", value: String(now.getMonth() + 1).padStart(2, "0"), width: 0.2 },
    { label: "Año:", value: String(now.getFullYear()), width: 0.2 },
  ];
  fieldRow(dateFields, 7);
  y += sectionGap;

  // ===================== SECCIÓN 1 =====================
  sectionTitle("SECCIÓN 1 — UBICACIÓN GEOGRÁFICA DE LA EMPRESA");

  fieldRow([
    { label: "Estado:", value: "", width: 1 / 3 },
    { label: "Municipio:", value: "", width: 1 / 3 },
    { label: "Parroquia:", value: "", width: 1 / 3 },
  ]);

  fieldRow([{ label: "Razón Social de la Empresa:", value: data.razonSocial, width: 1 }]);

  fieldRow([{ label: "R.I.F.:", value: data.rif, width: 1 }]);

  y += sectionGap;

  // ===================== SECCIÓN 2 =====================
  sectionTitle("SECCIÓN 2 — DATOS DEL REPRESENTANTE LEGAL");

  fieldRow([
    { label: "Nombre(s) y Apellido(s):", value: data.representanteLegal, width: 0.5 },
    { label: "C.I.:", value: data.cedulaRepresentante, width: 0.5 },
  ]);

  fieldRow([
    { label: "Celular:", value: data.celular, width: 1 / 3 },
    { label: "Teléfono fijo:", value: data.telefonoFijo, width: 1 / 3 },
    { label: "Correo electrónico:", value: data.correo, width: 1 / 3 },
  ]);

  y += sectionGap;

  // ===================== SECCIÓN 3 =====================
  sectionTitle("SECCIÓN 3 — RECAUDOS NECESARIOS PARA LA APERTURA");

  const checkH = 5.5;
  for (const req of data.requirements) {
    const isChecked = data.uploadedDocTypes.has(req.key);
    const checkmark = isChecked ? "[X]" : "[  ]";

    drawBox(marginL, y, contentW, checkH);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(7.5);

    doc.setFont("courier", "normal");
    doc.text(checkmark, marginL + 2, y + 3.8);

    doc.setFont("Roboto", "normal");
    let label = req.label.replace(/≤/g, "<=");
    if (req.conditional && req.conditionalLabel) {
      label += ` (${req.conditionalLabel})`;
    }
    doc.text(label, marginL + 12, y + 3.8);
    y += checkH;
  }

  y += sectionGap;

  // ===================== SECCIÓN 4 =====================
  sectionTitle("SECCIÓN 4 — FIRMA DEL REPRESENTANTE LEGAL");

  doc.setFont("Roboto", "italic");
  doc.setFontSize(7);
  doc.text(
    "IMPORTANTE: Debe ser llenada por el representante legal de la empresa, firmada y con sello húmedo.",
    marginL + 2,
    y + 4
  );
  y += 7;

  fieldRow([
    { label: "Firma:", value: "", width: 0.5 },
    { label: "Sello:", value: "", width: 0.5 },
  ], 20);

  y += sectionGap;

  // ===================== SECCIÓN 5 =====================
  sectionTitle("SECCIÓN 5 — PARA SER LLENADO POR LA CORPORACIÓN SOCIALISTA DEL CEMENTO S.A.");

  fieldRow([
    { label: "Nombre y Apellido:", value: "", width: 0.5 },
    { label: "Firma:", value: "", width: 0.5 },
  ], 12);

  fieldRow([
    { label: "Sello:", value: "", width: 0.4 },
    { label: "Día:", value: "", width: 0.2 },
    { label: "Mes:", value: "", width: 0.2 },
    { label: "Año:", value: "", width: 0.2 },
  ], 12);

  // ===================== DOWNLOAD =====================
  const fileName = `HOJA_DE_CONSIGNACION_${data.rif || "SIN_RIF"}.pdf`;
  doc.save(fileName);
}
