import jsPDF from "jspdf";

export type InvoiceData = {
  invoiceNo: string;
  date: string;
  customerName: string;
  customerEmail: string;
  plan: string;
  amount: number;
  currency: string;
  provider: string;
  providerRef: string;
};

export function generateInvoicePDF(data: InvoiceData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();

  // Brand band
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, W, 90, "F");
  doc.setTextColor(255);
  doc.setFontSize(22).setFont("helvetica", "bold");
  doc.text("LearnFlow", 40, 50);
  doc.setFontSize(11).setFont("helvetica", "normal");
  doc.text("Languages Learning Platform", 40, 70);

  doc.setTextColor(30);
  doc.setFontSize(28).setFont("helvetica", "bold");
  doc.text("INVOICE", W - 40, 50, { align: "right" });
  doc.setFontSize(10).setFont("helvetica", "normal");
  doc.setTextColor(255);
  doc.text(`# ${data.invoiceNo}`, W - 40, 70, { align: "right" });

  doc.setTextColor(30);
  let y = 130;
  doc.setFontSize(10).setFont("helvetica", "bold");
  doc.text("BILLED TO", 40, y);
  doc.text("INVOICE DETAILS", W - 40, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  y += 18;
  doc.text(data.customerName || "Customer", 40, y);
  doc.text(`Date: ${data.date}`, W - 40, y, { align: "right" });
  y += 14;
  doc.text(data.customerEmail, 40, y);
  doc.text(`Payment: ${data.provider}`, W - 40, y, { align: "right" });
  y += 14;
  doc.text(`Ref: ${data.providerRef}`, W - 40, y, { align: "right" });

  // Items table
  y += 40;
  doc.setFillColor(243, 244, 246);
  doc.rect(40, y, W - 80, 28, "F");
  doc.setFont("helvetica", "bold").setFontSize(10);
  doc.text("DESCRIPTION", 52, y + 18);
  doc.text("AMOUNT", W - 52, y + 18, { align: "right" });

  y += 48;
  doc.setFont("helvetica", "normal");
  doc.text(`LearnFlow Premium — ${data.plan}`, 52, y);
  doc.text(`${data.amount.toFixed(2)} ${data.currency}`, W - 52, y, { align: "right" });

  // Total
  y += 30;
  doc.setDrawColor(220);
  doc.line(40, y, W - 40, y);
  y += 26;
  doc.setFont("helvetica", "bold").setFontSize(14);
  doc.text("TOTAL", 52, y);
  doc.text(`${data.amount.toFixed(2)} ${data.currency}`, W - 52, y, { align: "right" });

  // Footer
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(120);
  doc.text(
    "Thank you for your purchase. This is an electronically generated invoice.",
    W / 2,
    doc.internal.pageSize.getHeight() - 60,
    { align: "center" },
  );
  doc.text("LearnFlow • support@learnflow.app", W / 2, doc.internal.pageSize.getHeight() - 44, { align: "center" });

  doc.save(`learnflow-invoice-${data.invoiceNo}.pdf`);
}
