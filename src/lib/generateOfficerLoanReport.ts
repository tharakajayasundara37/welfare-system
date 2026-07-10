import { put } from "@vercel/blob";
import PDFDocument from "pdfkit/js/pdfkit.standalone";

interface ReportUser {
  _id?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  nic?: string;
  employeeId?: string;
  department?: string;
  jobRole?: string;
  role?: string;
}

interface ReportDocument {
  label?: string;
  documentType?: string;
  originalName?: string;
  fileName?: string;
  status?: string;
  verifiedAt?: Date | string | null;
  remark?: string;
}

interface ReportLoan {
  _id: string;
  userId?: ReportUser;
  welfareOfficerId?: ReportUser;

  loanType?: string;
  requestedAmount?: number;
  approvedAmount?: number;
  purpose?: string;
  monthlyIncome?: number;
  employmentType?: string;

  guarantorName?: string;
  guarantorPhone?: string;
  guarantorNic?: string;

  systemInterestRate?: number;
  preferredPeriodMonths?: number;
  recommendedPeriodMonths?: number;
  monthlyInstallment?: number;
  totalRepayment?: number;

  riskLevel?: string;
  eligibilityStatus?: string;
  documentStatus?: string;
  status?: string;

  officerRemark?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface GenerateOfficerLoanReportParams {
  loan: ReportLoan;
  documents: ReportDocument[];
  officer: ReportUser;
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const PAGE_MARGIN = 42;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const FOOTER_Y = 748;

const colors = {
  ink: "#172033",
  muted: "#64748b",
  white: "#ffffff",

  navy: "#102a43",
  dark: "#0f172a",
  blue: "#2563eb",
  cyan: "#0891b2",
  green: "#047857",
  orange: "#c2410c",
  red: "#b91c1c",

  softBlue: "#eff6ff",
  softCyan: "#ecfeff",
  softGreen: "#ecfdf5",
  softOrange: "#fff7ed",
  softRed: "#fef2f2",

  tableHeader: "#dbeafe",
  border: "#d7e3f5",
};

const formatCurrency = (amount?: number) => {
  if (amount === undefined || amount === null) return "LKR 0";
  return `LKR ${Number(amount || 0).toLocaleString("en-LK")}`;
};

const formatDate = (date?: Date | string | null) => {
  if (!date) return "N/A";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "N/A";

  return parsedDate.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const valueOrNA = (value?: string | number | null) => {
  if (value === undefined || value === null || value === "") return "N/A";
  return String(value);
};

const formatReadable = (value?: string | number | null) => {
  return valueOrNA(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const shortRef = (id: string) => {
  return `REV-${new Date().getFullYear()}-${id.slice(-8).toUpperCase()}`;
};

function addWatermark(doc: PDFKit.PDFDocument) {
  doc.save();

  doc
    .font("Helvetica-Bold")
    .fontSize(44)
    .fillColor("#e2e8f0")
    .fillOpacity(0.23)
    .rotate(-32, { origin: [PAGE_WIDTH / 2, PAGE_HEIGHT / 2] })
    .text("OFFICER REVIEW", 35, 470, {
      width: 520,
      align: "center",
      lineBreak: false,
    });

  doc.restore();
  doc.fillOpacity(1);
}

function addFooter(doc: PDFKit.PDFDocument, pageLabel = "Officer Review Report") {
  const footerTop = FOOTER_Y;

  doc
    .moveTo(PAGE_MARGIN, footerTop)
    .lineTo(PAGE_WIDTH - PAGE_MARGIN, footerTop)
    .strokeColor("#dbeafe")
    .lineWidth(1)
    .stroke();

  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(colors.navy)
    .text("Welfare Management System", PAGE_MARGIN, footerTop + 10, {
      width: 220,
      align: "left",
      lineBreak: false,
    });

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(colors.muted)
    .text(`Generated Document - ${pageLabel}`, PAGE_MARGIN, footerTop + 23, {
      width: 240,
      align: "left",
      lineBreak: false,
    });

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(colors.muted)
    .text(
      "This is a system generated officer review report.",
      PAGE_WIDTH - PAGE_MARGIN - 260,
      footerTop + 10,
      {
        width: 260,
        align: "right",
        lineBreak: false,
      }
    );

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(colors.muted)
    .text(
      "Used for internal welfare loan approval workflow.",
      PAGE_WIDTH - PAGE_MARGIN - 260,
      footerTop + 23,
      {
        width: 260,
        align: "right",
        lineBreak: false,
      }
    );
}

function ensureSpace(
  doc: PDFKit.PDFDocument,
  neededHeight = 120,
  footerLabel = "Officer Review Report"
) {
  if (doc.y + neededHeight > FOOTER_Y - 20) {
    addFooter(doc, footerLabel);
    doc.addPage();
    addWatermark(doc);
    doc.y = PAGE_MARGIN;
  }
}

function getToneColor(value?: string) {
  const normalized = String(value || "").toLowerCase();

  if (
    normalized.includes("verified") ||
    normalized.includes("approved") ||
    normalized.includes("eligible") ||
    normalized.includes("low") ||
    normalized.includes("complete")
  ) {
    return {
      fill: colors.softGreen,
      border: "#bbf7d0",
      text: colors.green,
    };
  }

  if (
    normalized.includes("reject") ||
    normalized.includes("high") ||
    normalized.includes("invalid") ||
    normalized.includes("failed")
  ) {
    return {
      fill: colors.softRed,
      border: "#fecaca",
      text: colors.red,
    };
  }

  return {
    fill: colors.softOrange,
    border: "#fed7aa",
    text: colors.orange,
  };
}

function addHeader(
  doc: PDFKit.PDFDocument,
  referenceId: string,
  loanId: string
) {
  doc.rect(0, 0, PAGE_WIDTH, 138).fill(colors.navy);

  doc
    .circle(PAGE_WIDTH - 88, 45, 54)
    .fillColor("#38bdf8")
    .fillOpacity(0.22)
    .fill();

  doc
    .circle(PAGE_WIDTH - 130, 98, 35)
    .fillColor("#60a5fa")
    .fillOpacity(0.16)
    .fill();

  doc.fillOpacity(1);

  doc
    .roundedRect(PAGE_MARGIN, 24, 56, 56, 15)
    .fillAndStroke(colors.blue, "#93c5fd");

  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor(colors.white)
    .text("R", PAGE_MARGIN, 39, {
      width: 56,
      align: "center",
      lineBreak: false,
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#bfdbfe")
    .text("WELFARE MANAGEMENT SYSTEM", PAGE_MARGIN + 72, 28, {
      characterSpacing: 1.4,
      lineBreak: false,
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor(colors.white)
    .text("Welfare Officer Review Report", PAGE_MARGIN + 72, 48, {
      width: 330,
      lineBreak: false,
    });

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#dbeafe")
    .text(
      "Internal loan review document generated after officer verification",
      PAGE_MARGIN + 72,
      80,
      {
        width: 350,
        lineBreak: false,
      }
    );

  doc
    .roundedRect(PAGE_WIDTH - 212, 30, 170, 74, 14)
    .fillAndStroke("#0f172a", "#334155");

  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor("#93c5fd")
    .text("REPORT REFERENCE", PAGE_WIDTH - 194, 46, {
      lineBreak: false,
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(colors.white)
    .text(referenceId, PAGE_WIDTH - 194, 63, {
      width: 135,
      ellipsis: true,
      lineBreak: false,
    });

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#cbd5e1")
    .text(`Loan ID: ${loanId.slice(-10).toUpperCase()}`, PAGE_WIDTH - 194, 82, {
      width: 135,
      ellipsis: true,
      lineBreak: false,
    });

  doc.y = 158;
}

function addStatusBanner(doc: PDFKit.PDFDocument, loan: ReportLoan) {
  ensureSpace(doc, 92);

  const tone = getToneColor(loan.status || loan.documentStatus);
  const y = doc.y;

  doc.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, 82, 16).fillAndStroke(tone.fill, tone.border);

  doc.circle(PAGE_MARGIN + 33, y + 41, 18).fillColor(tone.text).fill();

  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor(colors.white)
    .text("✓", PAGE_MARGIN + 23, y + 31, {
      lineBreak: false,
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(tone.text)
    .text("OFFICER VERIFICATION COMPLETED", PAGE_MARGIN + 62, y + 18, {
      lineBreak: false,
    });

  doc
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor(colors.ink)
    .text(
      "This report confirms that the Welfare Officer reviewed the loan application, applicant information, guarantor details, submitted documents, and forwarded the case to Main Admin for final decision.",
      PAGE_MARGIN + 62,
      y + 40,
      {
        width: CONTENT_WIDTH - 82,
        lineGap: 3,
      }
    );

  doc.y = y + 100;
}

function addSectionTitle(doc: PDFKit.PDFDocument, title: string) {
  ensureSpace(doc, 52);

  const y = doc.y + 2;

  doc
    .roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, 28, 8)
    .fillAndStroke(colors.tableHeader, "#bfdbfe");

  doc
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .fillColor(colors.navy)
    .text(title.toUpperCase(), PAGE_MARGIN + 12, y + 8, {
      width: CONTENT_WIDTH - 24,
      lineBreak: false,
    });

  doc.y = y + 38;
}

function addSummaryCards(
  doc: PDFKit.PDFDocument,
  cards: Array<{
    label: string;
    value: string;
    tone?: "blue" | "green" | "orange" | "red";
  }>
) {
  ensureSpace(doc, 92);

  const gap = 10;
  const cardWidth = (CONTENT_WIDTH - gap * 2) / 3;
  const cardHeight = 70;
  const y = doc.y;

  cards.slice(0, 3).forEach((card, index) => {
    const x = PAGE_MARGIN + index * (cardWidth + gap);

    const fillColor =
      card.tone === "green"
        ? colors.softGreen
        : card.tone === "orange"
          ? colors.softOrange
          : card.tone === "red"
            ? colors.softRed
            : colors.softBlue;

    const borderColor =
      card.tone === "green"
        ? "#bbf7d0"
        : card.tone === "orange"
          ? "#fed7aa"
          : card.tone === "red"
            ? "#fecaca"
            : "#bfdbfe";

    const textColor =
      card.tone === "green"
        ? colors.green
        : card.tone === "orange"
          ? colors.orange
          : card.tone === "red"
            ? colors.red
            : colors.blue;

    doc.roundedRect(x, y, cardWidth, cardHeight, 12).fillAndStroke(fillColor, borderColor);

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(colors.muted)
      .text(card.label.toUpperCase(), x + 12, y + 13, {
        width: cardWidth - 24,
        lineBreak: false,
      });

    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor(textColor)
      .text(card.value, x + 12, y + 34, {
        width: cardWidth - 24,
        ellipsis: true,
        lineBreak: false,
      });
  });

  doc.y = y + cardHeight + 18;
}

function addTwoColumnInfoTable(
  doc: PDFKit.PDFDocument,
  leftTitle: string,
  leftRows: Array<[string, string | number | undefined | null]>,
  rightTitle: string,
  rightRows: Array<[string, string | number | undefined | null]>
) {
  const gap = 14;
  const boxWidth = (CONTENT_WIDTH - gap) / 2;
  const rowHeight = 26;
  const rowsCount = Math.max(leftRows.length, rightRows.length);
  const tableHeight = 30 + rowsCount * rowHeight;

  ensureSpace(doc, tableHeight + 16);

  const y = doc.y;

  function drawBox(
    x: number,
    title: string,
    rows: Array<[string, string | number | undefined | null]>
  ) {
    doc.roundedRect(x, y, boxWidth, tableHeight, 12).fillAndStroke(colors.white, colors.border);

    doc.roundedRect(x, y, boxWidth, 30, 12).fillAndStroke(colors.softCyan, "#bae6fd");

    doc
      .font("Helvetica-Bold")
      .fontSize(9.5)
      .fillColor(colors.navy)
      .text(title, x + 12, y + 10, {
        width: boxWidth - 24,
        lineBreak: false,
      });

    for (let index = 0; index < rowsCount; index += 1) {
      const row = rows[index];
      const rowY = y + 30 + index * rowHeight;
      const fill = index % 2 === 0 ? "#f8fafc" : colors.white;

      doc.rect(x, rowY, boxWidth, rowHeight).fillAndStroke(fill, "#e2e8f0");

      if (row) {
        const [label, value] = row;

        doc
          .font("Helvetica-Bold")
          .fontSize(8)
          .fillColor(colors.muted)
          .text(label, x + 10, rowY + 8, {
            width: 82,
            ellipsis: true,
            lineBreak: false,
          });

        doc
          .font("Helvetica")
          .fontSize(8.3)
          .fillColor(colors.ink)
          .text(valueOrNA(value), x + 96, rowY + 8, {
            width: boxWidth - 106,
            ellipsis: true,
            lineBreak: false,
          });
      }
    }
  }

  drawBox(PAGE_MARGIN, leftTitle, leftRows);
  drawBox(PAGE_MARGIN + boxWidth + gap, rightTitle, rightRows);

  doc.y = y + tableHeight + 18;
}

function addFullWidthInfoTable(
  doc: PDFKit.PDFDocument,
  rows: Array<[string, string | number | undefined | null]>
) {
  const rowHeight = 27;
  const labelWidth = 190;
  const tableHeight = rows.length * rowHeight;

  ensureSpace(doc, tableHeight + 15);

  const startY = doc.y;

  rows.forEach(([label, value], index) => {
    const y = startY + index * rowHeight;
    const fill = index % 2 === 0 ? "#f8fafc" : colors.white;

    doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, rowHeight).fillAndStroke(fill, "#e2e8f0");

    doc
      .font("Helvetica-Bold")
      .fontSize(8.8)
      .fillColor(colors.muted)
      .text(label, PAGE_MARGIN + 12, y + 8, {
        width: labelWidth - 20,
        lineBreak: false,
      });

    doc
      .font("Helvetica")
      .fontSize(8.8)
      .fillColor(colors.ink)
      .text(valueOrNA(value), PAGE_MARGIN + labelWidth + 10, y + 8, {
        width: CONTENT_WIDTH - labelWidth - 22,
        ellipsis: true,
        lineBreak: false,
      });
  });

  doc.y = startY + tableHeight + 18;
}

function addDocumentChecklist(
  doc: PDFKit.PDFDocument,
  documents: ReportDocument[]
) {
  const rowHeight = 34;
  const headerHeight = 30;
  const tableHeight =
    headerHeight + Math.max(documents.length, 1) * rowHeight;

  ensureSpace(doc, tableHeight + 20);

  const y = doc.y;
  const colWidths = [170, 150, 95, 96];
  const headers = ["Document", "File Name", "Status", "Verified At"];

  doc.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, tableHeight, 12).fillAndStroke(colors.white, colors.border);

  let x = PAGE_MARGIN;

  headers.forEach((header, index) => {
    doc.rect(x, y, colWidths[index], headerHeight).fillAndStroke(colors.tableHeader, "#bfdbfe");

    doc
      .font("Helvetica-Bold")
      .fontSize(8.4)
      .fillColor(colors.navy)
      .text(header, x + 8, y + 10, {
        width: colWidths[index] - 16,
        lineBreak: false,
      });

    x += colWidths[index];
  });

  if (documents.length === 0) {
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(colors.muted)
      .text("No documents found for this loan application.", PAGE_MARGIN + 12, y + headerHeight + 11, {
        width: CONTENT_WIDTH - 24,
        lineBreak: false,
      });
  } else {
    documents.forEach((document, rowIndex) => {
      const rowY = y + headerHeight + rowIndex * rowHeight;
      const fill = rowIndex % 2 === 0 ? "#f8fafc" : colors.white;

      doc.rect(PAGE_MARGIN, rowY, CONTENT_WIDTH, rowHeight).fillAndStroke(fill, "#e2e8f0");

      let cellX = PAGE_MARGIN;
      const values = [
        document.label || document.documentType || "Document",
        document.originalName || document.fileName || "N/A",
        formatReadable(document.status),
        formatDate(document.verifiedAt),
      ];

      values.forEach((value, index) => {
        const statusTone = index === 2 ? getToneColor(value) : null;

        if (index === 2 && statusTone) {
          doc
            .roundedRect(cellX + 8, rowY + 8, colWidths[index] - 16, 18, 8)
            .fillAndStroke(statusTone.fill, statusTone.border);

          doc
            .font("Helvetica-Bold")
            .fontSize(7.5)
            .fillColor(statusTone.text)
            .text(value, cellX + 10, rowY + 13, {
              width: colWidths[index] - 20,
              align: "center",
              ellipsis: true,
              lineBreak: false,
            });
        } else {
          doc
            .font(index === 0 ? "Helvetica-Bold" : "Helvetica")
            .fontSize(7.9)
            .fillColor(index === 0 ? colors.ink : colors.muted)
            .text(value, cellX + 8, rowY + 10, {
              width: colWidths[index] - 16,
              ellipsis: true,
              lineBreak: false,
            });
        }

        cellX += colWidths[index];
      });
    });
  }

  doc.y = y + tableHeight + 18;
}

function addApprovalTimeline(
  doc: PDFKit.PDFDocument,
  steps: Array<{
    title: string;
    subtitle: string;
    status: "done" | "pending";
  }>
) {
  ensureSpace(doc, 112);

  const gap = 8;
  const stepWidth = (CONTENT_WIDTH - gap * (steps.length - 1)) / steps.length;
  const y = doc.y;

  steps.forEach((step, index) => {
    const x = PAGE_MARGIN + index * (stepWidth + gap);
    const done = step.status === "done";

    doc
      .roundedRect(x, y, stepWidth, 88, 12)
      .fillAndStroke(done ? colors.softGreen : colors.softOrange, done ? "#bbf7d0" : "#fed7aa");

    doc.circle(x + 18, y + 20, 9).fillColor(done ? colors.green : colors.orange).fill();

    doc
      .font("Helvetica-Bold")
      .fontSize(7)
      .fillColor(colors.white)
      .text(done ? "✓" : "•", x + 12.5, y + 13.5, {
        lineBreak: false,
      });

    doc
      .font("Helvetica-Bold")
      .fontSize(8.2)
      .fillColor(done ? colors.green : colors.orange)
      .text(step.title, x + 10, y + 36, {
        width: stepWidth - 20,
        align: "center",
        lineBreak: false,
      });

    doc
      .font("Helvetica")
      .fontSize(7.3)
      .fillColor(colors.muted)
      .text(step.subtitle, x + 10, y + 58, {
        width: stepWidth - 20,
        align: "center",
        lineGap: 2,
      });
  });

  doc.y = y + 106;
}

function addDecisionBox(doc: PDFKit.PDFDocument, loan: ReportLoan, officer: ReportUser) {
  ensureSpace(doc, 132);

  const y = doc.y;

  doc.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, 110, 14).fillAndStroke(colors.softGreen, "#bbf7d0");

  doc.circle(PAGE_MARGIN + 34, y + 32, 18).fillColor(colors.green).fill();

  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor(colors.white)
    .text("✓", PAGE_MARGIN + 24, y + 22, {
      lineBreak: false,
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(colors.green)
    .text("OFFICER VERIFICATION COMPLETED", PAGE_MARGIN + 62, y + 18, {
      lineBreak: false,
    });

  doc
    .font("Helvetica")
    .fontSize(9.2)
    .fillColor("#065f46")
    .text(
      "This report was generated automatically after the Welfare Officer completed document verification and forwarded the loan application to Main Admin for final approval.",
      PAGE_MARGIN + 62,
      y + 40,
      {
        width: CONTENT_WIDTH - 82,
        lineGap: 3,
      }
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(8.8)
    .fillColor(colors.green)
    .text("Officer:", PAGE_MARGIN + 62, y + 78, {
      underline: false,
    });

  doc
    .font("Helvetica")
    .fontSize(8.8)
    .fillColor(colors.ink)
    .text(` ${valueOrNA(officer.fullName)} | ${valueOrNA(officer.employeeId)}`, PAGE_MARGIN + 102, y + 78, {
      lineBreak: false,
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(8.8)
    .fillColor(colors.green)
    .text("Remark:", PAGE_MARGIN + 62, y + 93, {
      underline: false,
    });

  doc
    .font("Helvetica")
    .fontSize(8.8)
    .fillColor(colors.ink)
    .text(` ${valueOrNA(loan.officerRemark)}`, PAGE_MARGIN + 106, y + 93, {
      width: CONTENT_WIDTH - 120,
      ellipsis: true,
      lineBreak: false,
    });

  doc.y = y + 130;
}

function addSignatureSection(
  doc: PDFKit.PDFDocument,
  officer: ReportUser,
  referenceId: string
) {
  ensureSpace(doc, 125);

  const y = doc.y;
  const gap = 14;
  const boxWidth = (CONTENT_WIDTH - gap) / 2;

  doc.roundedRect(PAGE_MARGIN, y, boxWidth, 102, 12).fillAndStroke(colors.white, colors.border);

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(colors.navy)
    .text("REVIEWED BY", PAGE_MARGIN + 14, y + 14, {
      lineBreak: false,
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(colors.ink)
    .text(valueOrNA(officer.fullName), PAGE_MARGIN + 14, y + 36, {
      width: boxWidth - 28,
      lineBreak: false,
    });

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(colors.muted)
    .text(valueOrNA(officer.email), PAGE_MARGIN + 14, y + 54, {
      width: boxWidth - 28,
      lineBreak: false,
    })
    .text(`Employee ID: ${valueOrNA(officer.employeeId)}`, PAGE_MARGIN + 14, y + 70, {
      width: boxWidth - 28,
      lineBreak: false,
    });

  const rightX = PAGE_MARGIN + boxWidth + gap;

  doc.roundedRect(rightX, y, boxWidth, 102, 12).fillAndStroke(colors.softBlue, "#bfdbfe");

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(colors.blue)
    .text("DIGITAL VERIFICATION", rightX + 14, y + 14, {
      lineBreak: false,
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(colors.ink)
    .text(referenceId, rightX + 14, y + 36, {
      width: boxWidth - 28,
      lineBreak: false,
    });

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(colors.muted)
    .text(
      "This report is digitally generated from the Welfare Management System.",
      rightX + 14,
      y + 58,
      {
        width: boxWidth - 28,
        lineGap: 3,
      }
    );

  doc.y = y + 122;
}

export async function generateOfficerLoanReport({
  loan,
  documents,
  officer,
}: GenerateOfficerLoanReportParams) {
  const loanId = loan._id.toString();
  const referenceId = shortRef(loanId);

  const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: PAGE_MARGIN,
        info: {
          Title: "Welfare Officer Review Report",
          Author: "Welfare Management System",
          Subject: "Loan Application Review",
        },
      });

      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      addWatermark(doc);
      addHeader(doc, referenceId, loanId);
      addStatusBanner(doc, loan);

      addSummaryCards(doc, [
        {
          label: "Requested Amount",
          value: formatCurrency(loan.requestedAmount),
          tone: "blue",
        },
        {
          label: "Recommended EMI",
          value: formatCurrency(loan.monthlyInstallment),
          tone: "green",
        },
        {
          label: "Risk Level",
          value: formatReadable(loan.riskLevel),
          tone: String(loan.riskLevel || "").toLowerCase().includes("high")
            ? "red"
            : "orange",
        },
      ]);

      addSectionTitle(doc, "Application and Officer Information");

      addTwoColumnInfoTable(
        doc,
        "Primary Applicant",
        [
          ["Full Name", loan.userId?.fullName],
          ["Email", loan.userId?.email],
          ["Phone", loan.userId?.phone],
          ["NIC", loan.userId?.nic],
          ["Employee ID", loan.userId?.employeeId],
          ["Department", loan.userId?.department],
          ["Job Role", loan.userId?.jobRole],
        ],
        "Review Officer",
        [
          ["Officer Name", officer.fullName],
          ["Officer Email", officer.email],
          ["Officer Role", formatReadable(officer.role)],
          ["Employee ID", officer.employeeId],
          ["Report Date", formatDate(new Date())],
          ["Reference ID", referenceId],
          ["Final Forward Status", "Forwarded to Admin Approval"],
        ]
      );

      addSectionTitle(doc, "Loan Application Summary");

      addFullWidthInfoTable(doc, [
        ["Loan Type", loan.loanType],
        ["Application Status", formatReadable(loan.status)],
        ["Requested Amount", formatCurrency(loan.requestedAmount)],
        ["Approved / Recommended Amount", formatCurrency(loan.approvedAmount)],
        ["Monthly Installment", formatCurrency(loan.monthlyInstallment)],
        ["Total Repayment", formatCurrency(loan.totalRepayment)],
        ["Interest Rate", `${loan.systemInterestRate || 0}%`],
        ["Preferred Period", `${loan.preferredPeriodMonths || 0} months`],
        ["Recommended Period", `${loan.recommendedPeriodMonths || 0} months`],
        ["Risk Level", formatReadable(loan.riskLevel)],
        ["Eligibility Status", formatReadable(loan.eligibilityStatus)],
        ["Document Status", formatReadable(loan.documentStatus)],
      ]);

      addSectionTitle(doc, "Loan Purpose and Financial Assessment");

      addFullWidthInfoTable(doc, [
        ["Purpose", loan.purpose],
        ["Monthly Income", formatCurrency(loan.monthlyIncome)],
        ["Employment Type", formatReadable(loan.employmentType)],
      ]);

      addSectionTitle(doc, "Guarantor Details");

      addFullWidthInfoTable(doc, [
        ["Guarantor Name", loan.guarantorName],
        ["Guarantor Phone", loan.guarantorPhone],
        ["Guarantor NIC", loan.guarantorNic],
      ]);

      addSectionTitle(doc, "Document Verification Checklist");

      addDocumentChecklist(doc, documents);

      addSectionTitle(doc, "Review Workflow");

      addApprovalTimeline(doc, [
        {
          title: "Submitted",
          subtitle: "Loan application received",
          status: "done",
        },
        {
          title: "Documents",
          subtitle: "Documents checked",
          status: "done",
        },
        {
          title: "Officer Review",
          subtitle: "Officer decision added",
          status: "done",
        },
        {
          title: "Admin Approval",
          subtitle: "Waiting final admin decision",
          status: "pending",
        },
        {
          title: "Finance",
          subtitle: "After approval processing",
          status: "pending",
        },
      ]);

      addSectionTitle(doc, "Officer Review Decision");

      addDecisionBox(doc, loan, officer);

      addSectionTitle(doc, "Authorization and Digital Verification");

      addSignatureSection(doc, officer, referenceId);

      addFooter(doc);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });

  const blobPathName = `reports/officer-loan-reviews/${loanId}-officer-review.pdf`;
  
  const blob = await put(blobPathName, pdfBuffer, {
    access: "private", // This is the crucial fix for a private store
    contentType: "application/pdf",
  });

  return {
    reportUrl: blob.url,
    filePath: "",
  };
}