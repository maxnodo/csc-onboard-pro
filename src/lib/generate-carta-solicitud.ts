import { jsPDF } from "jspdf";

interface CartaData {
  razonSocial: string;
  rif: string;
  representanteLegal: string;
  cedulaRepresentante: string;
  celular: string;
  correo: string;
  category: string;
  categoryLabel: string;
}

export async function generateCartaSolicitud(data: CartaData) {
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

  doc.addFileToVFS("Roboto-Regular.ttf", robotoRegularBase64);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFileToVFS("Roboto-Bold.ttf", robotoBoldBase64);
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
  doc.addFileToVFS("Roboto-Italic.ttf", robotoItalicBase64);
  doc.addFont("Roboto-Italic.ttf", "Roboto", "italic");

  const pageW = doc.internal.pageSize.getWidth();
  const marginL = 20;
  const marginR = 20;
  const contentW = pageW - marginL - marginR;
  let y = 25;

  // --- Header ---
  doc.setFont("Roboto", "bold");
  doc.setFontSize(12);
  doc.text("CORPORACIÓN SOCIALISTA DEL CEMENTO, S.A.", pageW / 2, y, { align: "center" });
  y += 6;

  doc.setFontSize(10);
  doc.text("CARTA DE SOLICITUD", pageW / 2, y, { align: "center" });
  y += 10;

  // --- Date ---
  const now = new Date();
  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  const dateStr = `${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`;

  doc.setFont("Roboto", "normal");
  doc.setFontSize(10);
  doc.text(`Fecha: ${dateStr}`, pageW - marginR, y, { align: "right" });
  y += 12;

  // --- Addressee ---
  doc.setFont("Roboto", "bold");
  doc.setFontSize(10);
  doc.text("Señores:", marginL, y);
  y += 5;
  doc.text("CORPORACIÓN SOCIALISTA DEL CEMENTO, S.A.", marginL, y);
  y += 5;
  doc.setFont("Roboto", "normal");
  doc.text("Presente.-", marginL, y);
  y += 10;

  // --- Reference line ---
  doc.setFont("Roboto", "bold");
  doc.text("Ref.: Solicitud de Registro como " + data.categoryLabel, marginL, y);
  y += 10;

  // --- Body ---
  doc.setFont("Roboto", "normal");
  doc.setFontSize(10);

  const bodyLine1 = `Yo, ${data.representanteLegal || "________________________"}, titular de la cédula de identidad N° ${data.cedulaRepresentante || "________________"}, en mi carácter de representante legal de ${data.razonSocial || "________________________"}, con RIF ${data.rif || "________________"}, me dirijo a ustedes con la finalidad de solicitar formalmente el registro de nuestra ${getEntityType(data.category)} ante la Corporación Socialista del Cemento, S.A., en la categoría de ${data.categoryLabel}.`;

  const lines1 = doc.splitTextToSize(bodyLine1, contentW);
  doc.text(lines1, marginL, y);
  y += lines1.length * 5 + 5;

  const bodyLine2 = "A tal efecto, anexo los recaudos requeridos debidamente organizados según la planilla de consignación de documentos, para su revisión y aprobación correspondiente.";
  const lines2 = doc.splitTextToSize(bodyLine2, contentW);
  doc.text(lines2, marginL, y);
  y += lines2.length * 5 + 5;

  const bodyLine3 = "Declaro que la información suministrada y los documentos consignados son veraces y fidedignos, asumiendo la responsabilidad legal que de ello se derive.";
  const lines3 = doc.splitTextToSize(bodyLine3, contentW);
  doc.text(lines3, marginL, y);
  y += lines3.length * 5 + 5;

  const bodyLine4 = "Sin otro particular al que hacer referencia, quedo a su disposición para cualquier información adicional que requieran.";
  const lines4 = doc.splitTextToSize(bodyLine4, contentW);
  doc.text(lines4, marginL, y);
  y += lines4.length * 5 + 8;

  doc.text("Atentamente,", marginL, y);
  y += 25;

  // --- Signature block ---
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(marginL, y, marginL + 80, y);
  y += 5;

  doc.setFont("Roboto", "bold");
  doc.setFontSize(10);
  doc.text(data.representanteLegal || "(Nombre del Representante Legal)", marginL, y);
  y += 5;

  doc.setFont("Roboto", "normal");
  doc.text(`C.I.: ${data.cedulaRepresentante || "________________"}`, marginL, y);
  y += 5;
  doc.text(`Cargo: Representante Legal`, marginL, y);
  y += 5;
  if (data.celular) {
    doc.text(`Teléfono: ${data.celular}`, marginL, y);
    y += 5;
  }
  if (data.correo) {
    doc.text(`Correo: ${data.correo}`, marginL, y);
    y += 5;
  }

  y += 10;

  // --- Seal area ---
  doc.setFont("Roboto", "italic");
  doc.setFontSize(8);
  doc.text("Sello húmedo de la empresa:", marginL, y);
  y += 3;
  doc.setDrawColor(180);
  doc.setLineWidth(0.2);
  doc.rect(marginL, y, 60, 25);

  // --- Footer note ---
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFont("Roboto", "italic");
  doc.setFontSize(7);
  doc.text(
    "Documento generado automáticamente por el Sistema de Onboarding Documental de CSC. Debe ser impreso, firmado y sellado antes de consignar.",
    pageW / 2,
    footerY,
    { align: "center" }
  );

  const fileName = `CARTA_DE_SOLICITUD_${data.rif || "SIN_RIF"}.pdf`;
  doc.save(fileName);
}

function getEntityType(category: string): string {
  switch (category) {
    case "distribuidor": return "empresa";
    case "constructor": return "empresa constructora";
    case "emprendedor": return "actividad emprendedora";
    case "alcaldia": return "institución";
    default: return "organización";
  }
}
