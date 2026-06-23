import { mkdir, writeFile } from "fs/promises";
import path from "path";
import PDFDocument from "pdfkit/js/pdfkit.standalone";

interface LetterUser {
  _id?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  nic?: string;
  employeeId?: string;
  department?: string;
  jobRole?: string;
}

interface LetterAdmin {
  _id?: string;
  fullName?: string;
  email?: string;
  role?: string;
  employeeId?: string;
}

interface LetterLoan {
  _id: string;
  userId?: LetterUser;
  adminId?: LetterAdmin;

  loanType?: string;
  supportType?: string;
  isRepayable?: boolean;

  requestedAmount?: number;
  approvedAmount?: number;
  purpose?: string;

  systemInterestRate?: number;
  preferredPeriodMonths?: number;
  approvedPeriodMonths?: number;
  monthlyInstallment?: number;
  totalRepayment?: number;
  remainingBalance?: number;

  riskLevel?: string;
  eligibilityStatus?: string;
  status?: string;

  officerRemark?: string;
  adminRemark?: string;

  createdAt?: Date | string;
  adminApprovedAt?: Date | string | null;
}

interface GenerateLoanApprovalLetterParams {
  loan: LetterLoan;
  admin: LetterAdmin;
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const PAGE_MARGIN = 42;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const FOOTER_Y = 748;

const colors = {
  ink: "#172033",
  muted: "#64748b",
  lightText: "#eaf2ff",
  white: "#ffffff",

  navy: "#102a43",
  blue: "#2563eb",
  cyan: "#0891b2",
  teal: "#0f766e",
  green: "#047857",
  orange: "#c2410c",
  red: "#b91c1c",

  cream: "#fffaf3",
  softBlue: "#eff6ff",
  softCyan: "#ecfeff",
  softGreen: "#ecfdf5",
  softOrange: "#fff7ed",
  softRed: "#fef2f2",
  tableHeader: "#dbeafe",
  tableBorder: "#bfdbfe",
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
  return `WEL-${new Date().getFullYear()}-${id.slice(-8).toUpperCase()}`;
};

function addWatermark(doc: PDFKit.PDFDocument) {
  doc.save();

  doc
    .font("Helvetica-Bold")
    .fontSize(48)
    .fillColor("#e2e8f0")
    .fillOpacity(0.25)
    .rotate(-32, { origin: [PAGE_WIDTH / 2, PAGE_HEIGHT / 2] })
    .text("WELFARE", 75, 470, {
      width: 450,
      align: "center",
      lineBreak: false,
    });

  doc.restore();
  doc.fillOpacity(1);
}

function addFooter(doc: PDFKit.PDFDocument, pageLabel = "Official Document") {
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
      "This is a system generated approval letter.",
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
      "No manual signature is required for online verification.",
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
  footerLabel = "Official Document"
) {
  if (doc.y + neededHeight > FOOTER_Y - 20) {
    addFooter(doc, footerLabel);
    doc.addPage();
    addWatermark(doc);
    doc.y = PAGE_MARGIN;
  }
}

function addHeader(
  doc: PDFKit.PDFDocument,
  title: string,
  referenceId: string,
  isFuneralSupport: boolean
) {
  doc.rect(0, 0, PAGE_WIDTH, 138).fill(colors.navy);

  doc
    .circle(PAGE_WIDTH - 88, 45, 54)
    .fillColor(isFuneralSupport ? "#10b981" : "#38bdf8")
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
    .fillAndStroke(isFuneralSupport ? colors.green : colors.blue, "#93c5fd");

  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor(colors.white)
    .text("W", PAGE_MARGIN, 39, {
      width: 56,
      align: "center",
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#bfdbfe")
    .text("WELFARE MANAGEMENT SYSTEM", PAGE_MARGIN + 72, 28, {
      characterSpacing: 1.4,
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(23)
    .fillColor(colors.white)
    .text(title, PAGE_MARGIN + 72, 48, {
      width: 310,
    });

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#dbeafe")
    .text(
      "Official approval document generated by the Welfare platform",
      PAGE_MARGIN + 72,
      80,
      {
        width: 330,
      }
    );

  doc
    .roundedRect(PAGE_WIDTH - 212, 30, 170, 74, 14)
    .fillAndStroke("#0f172a", "#334155");

  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor("#93c5fd")
    .text("DOCUMENT REFERENCE", PAGE_WIDTH - 194, 46);

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(colors.white)
    .text(referenceId, PAGE_WIDTH - 194, 63, {
      width: 135,
      ellipsis: true,
    });

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#cbd5e1")
    .text(`Generated: ${formatDate(new Date())}`, PAGE_WIDTH - 194, 83, {
      width: 135,
    });

  doc.y = 158;
}

function addStatusBanner(
  doc: PDFKit.PDFDocument,
  isFuneralSupport: boolean
) {
  ensureSpace(doc, 92);

  const y = doc.y;
  const fill = isFuneralSupport ? colors.softGreen : colors.softBlue;
  const border = isFuneralSupport ? "#bbf7d0" : "#bfdbfe";
  const titleColor = isFuneralSupport ? colors.green : colors.blue;

  doc.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, 82, 16).fillAndStroke(fill, border);

  doc
    .circle(PAGE_MARGIN + 33, y + 41, 18)
    .fillColor(isFuneralSupport ? colors.green : colors.blue)
    .fill();

  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor(colors.white)
    .text("OK", PAGE_MARGIN + 23, y + 31);

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(titleColor)
    .text(
      isFuneralSupport ? "APPROVED FUNERAL SUPPORT" : "APPROVED LOAN OFFER",
      PAGE_MARGIN + 62,
      y + 18
    );

  doc
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor(isFuneralSupport ? "#065f46" : "#1e3a8a")
    .text(
      isFuneralSupport
        ? "This non-repayable welfare support request has been approved by Main Admin and forwarded to Finance Officer for disbursement processing."
        : "This loan has been approved by Main Admin and is waiting for member acceptance before finance processing.",
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
    });

  doc.y = y + 38;
}

function addSummaryCards(
  doc: PDFKit.PDFDocument,
  cards: Array<{
    label: string;
    value: string;
    tone?: "blue" | "green" | "orange";
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
          : colors.softBlue;

    const borderColor =
      card.tone === "green"
        ? "#bbf7d0"
        : card.tone === "orange"
          ? "#fed7aa"
          : "#bfdbfe";

    const textColor =
      card.tone === "green"
        ? colors.green
        : card.tone === "orange"
          ? colors.orange
          : colors.blue;

    doc.roundedRect(x, y, cardWidth, cardHeight, 12).fillAndStroke(fillColor, borderColor);

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(colors.muted)
      .text(card.label.toUpperCase(), x + 12, y + 13, {
        width: cardWidth - 24,
      });

    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor(textColor)
      .text(card.value, x + 12, y + 34, {
        width: cardWidth - 24,
        ellipsis: true,
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
          });

        doc
          .font("Helvetica")
          .fontSize(8.3)
          .fillColor(colors.ink)
          .text(valueOrNA(value), x + 96, rowY + 8, {
            width: boxWidth - 106,
            ellipsis: true,
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
      });

    doc
      .font("Helvetica")
      .fontSize(8.8)
      .fillColor(colors.ink)
      .text(valueOrNA(value), PAGE_MARGIN + labelWidth + 10, y + 8, {
        width: CONTENT_WIDTH - labelWidth - 22,
        ellipsis: true,
      });
  });

  doc.y = startY + tableHeight + 18;
}

function addApprovalTimeline(
  doc: PDFKit.PDFDocument,
  steps: Array<{
    title: string;
    subtitle: string;
    status: "done" | "pending";
  }>
) {
  ensureSpace(doc, 115);

  const gap = 8;
  const stepWidth = (CONTENT_WIDTH - gap * (steps.length - 1)) / steps.length;
  const y = doc.y;

  steps.forEach((step, index) => {
    const x = PAGE_MARGIN + index * (stepWidth + gap);
    const done = step.status === "done";

    doc
      .roundedRect(x, y, stepWidth, 88, 12)
      .fillAndStroke(done ? colors.softGreen : colors.softOrange, done ? "#bbf7d0" : "#fed7aa");

    doc
      .circle(x + 18, y + 20, 9)
      .fillColor(done ? colors.green : colors.orange)
      .fill();

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(colors.white)
      .text(done ? "OK" : "•", x + 12.5, y + 13.5);

    doc
      .font("Helvetica-Bold")
      .fontSize(8.2)
      .fillColor(done ? colors.green : colors.orange)
      .text(step.title, x + 12, y + 36, {
        width: stepWidth - 24,
        align: "center",
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

function addParagraphBox(
  doc: PDFKit.PDFDocument,
  title: string,
  body: string,
  tone: "blue" | "green" | "orange" = "blue"
) {
  ensureSpace(doc, 112);

  const fill =
    tone === "green" ? colors.softGreen : tone === "orange" ? colors.softOrange : colors.softBlue;

  const border =
    tone === "green" ? "#bbf7d0" : tone === "orange" ? "#fed7aa" : "#bfdbfe";

  const titleColor =
    tone === "green" ? colors.green : tone === "orange" ? colors.orange : colors.blue;

  const startY = doc.y;

  doc.roundedRect(PAGE_MARGIN, startY, CONTENT_WIDTH, 94, 14).fillAndStroke(fill, border);

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(titleColor)
    .text(title, PAGE_MARGIN + 16, startY + 15);

  doc
    .font("Helvetica")
    .fontSize(9.2)
    .fillColor(colors.ink)
    .text(body, PAGE_MARGIN + 16, startY + 37, {
      width: CONTENT_WIDTH - 32,
      lineGap: 3,
    });

  doc.y = startY + 112;
}

function addTerms(doc: PDFKit.PDFDocument, terms: string[]) {
  ensureSpace(doc, 70);

  terms.forEach((term, index) => {
    ensureSpace(doc, 32);

    const y = doc.y;

    doc.circle(PAGE_MARGIN + 9, y + 8, 7).fillColor(colors.blue).fill();

    doc
      .font("Helvetica-Bold")
      .fontSize(7)
      .fillColor(colors.white)
      .text(String(index + 1), PAGE_MARGIN + 5, y + 3);

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(colors.ink)
      .text(term, PAGE_MARGIN + 25, y, {
        width: CONTENT_WIDTH - 30,
        lineGap: 3,
      });

    doc.moveDown(0.55);
  });
}

function addSignatureSection(
  doc: PDFKit.PDFDocument,
  admin: LetterAdmin,
  referenceId: string,
  isFuneralSupport: boolean
) {
  ensureSpace(doc, 135);

  const y = doc.y;
  const gap = 14;
  const boxWidth = (CONTENT_WIDTH - gap) / 2;

  doc.roundedRect(PAGE_MARGIN, y, boxWidth, 102, 12).fillAndStroke(colors.white, colors.border);

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(colors.navy)
    .text("AUTHORIZED BY", PAGE_MARGIN + 14, y + 14);

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(colors.ink)
    .text(valueOrNA(admin.fullName), PAGE_MARGIN + 14, y + 36, {
      width: boxWidth - 28,
    });

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(colors.muted)
    .text(valueOrNA(admin.email), PAGE_MARGIN + 14, y + 54, {
      width: boxWidth - 28,
    })
    .text(`Employee ID: ${valueOrNA(admin.employeeId)}`, PAGE_MARGIN + 14, y + 70, {
      width: boxWidth - 28,
    });

  const rightX = PAGE_MARGIN + boxWidth + gap;

  doc.roundedRect(rightX, y, boxWidth, 102, 12).fillAndStroke(colors.softBlue, "#bfdbfe");

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(colors.blue)
    .text("DIGITAL VERIFICATION", rightX + 14, y + 14);

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(colors.ink)
    .text(referenceId, rightX + 14, y + 36, {
      width: boxWidth - 28,
    });

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(colors.muted)
    .text(
      isFuneralSupport
        ? "Finance Officer must process grant disbursement."
        : "Member must accept offer before finance processing.",
      rightX + 14,
      y + 58,
      {
        width: boxWidth - 28,
        lineGap: 3,
      }
    );

  doc.y = y + 122;
}

export async function generateLoanApprovalLetter({
  loan,
  admin,
}: GenerateLoanApprovalLetterParams) {
  const loanId = loan._id.toString();
  const referenceId = shortRef(loanId);

  const isFuneralSupport =
    loan.loanType === "Funeral Support Loan" ||
    loan.supportType === "non_repayable_grant" ||
    loan.isRepayable === false;

  const documentTitle = isFuneralSupport
    ? "Funeral Support Approval Letter"
    : "Loan Approval Offer Letter";

  const letterDir = path.join(
    process.cwd(),
    "public",
    "reports",
    "loan-approval-letters"
  );

  await mkdir(letterDir, { recursive: true });

  const fileName = `${loanId}-loan-approval-letter.pdf`;
  const filePath = path.join(letterDir, fileName);
  const letterUrl = `/reports/loan-approval-letters/${fileName}`;

  const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: PAGE_MARGIN,
        info: {
          Title: documentTitle,
          Author: "Welfare Management System",
          Subject: documentTitle,
        },
      });

      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      addWatermark(doc);
      addHeader(doc, documentTitle, referenceId, isFuneralSupport);
      addStatusBanner(doc, isFuneralSupport);

      addSummaryCards(doc, [
        {
          label: "Approved Amount",
          value: formatCurrency(loan.approvedAmount),
          tone: "blue",
        },
        {
          label: isFuneralSupport ? "Repayment Type" : "Monthly EMI",
          value: isFuneralSupport
            ? "Non-repayable"
            : formatCurrency(loan.monthlyInstallment),
          tone: "green",
        },
        {
          label: isFuneralSupport ? "Finance Status" : "Repayment Period",
          value: isFuneralSupport
            ? "Processing"
            : `${loan.approvedPeriodMonths || loan.preferredPeriodMonths || 0} months`,
          tone: "orange",
        },
      ]);

      addSectionTitle(doc, "Applicant and Administrative Information");

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
        "Approval Authority",
        [
          ["Admin Name", admin.fullName],
          ["Admin Email", admin.email],
          ["Admin Role", admin.role || "Main Admin"],
          ["Employee ID", admin.employeeId],
          ["Approval Date", formatDate(loan.adminApprovedAt)],
          ["Reference ID", referenceId],
          ["Current Status", formatReadable(loan.status)],
        ]
      );

      addSectionTitle(
        doc,
        isFuneralSupport
          ? "Approved Funeral Support Details"
          : "Approved Loan Offer Details"
      );

      addFullWidthInfoTable(doc, [
        ["Request Type", isFuneralSupport ? "Funeral Support Grant" : valueOrNA(loan.loanType)],
        ["Purpose / Reason", loan.purpose],
        ["Requested Amount", formatCurrency(loan.requestedAmount)],
        ["Approved Amount", formatCurrency(loan.approvedAmount)],
        ["Interest Rate", isFuneralSupport ? "0%" : `${loan.systemInterestRate || 0}%`],
        [
          "Repayment Period",
          isFuneralSupport
            ? "Not applicable"
            : `${loan.approvedPeriodMonths || loan.preferredPeriodMonths || 0} months`,
        ],
        [
          "Monthly Installment",
          isFuneralSupport ? "Not applicable" : formatCurrency(loan.monthlyInstallment),
        ],
        [
          "Total Repayment",
          isFuneralSupport ? "Not applicable" : formatCurrency(loan.totalRepayment),
        ],
        [
          "Remaining Balance",
          isFuneralSupport ? "LKR 0" : formatCurrency(loan.remainingBalance),
        ],
        ["Risk Level", formatReadable(loan.riskLevel)],
        ["Eligibility Status", formatReadable(loan.eligibilityStatus)],
      ]);

      addSectionTitle(doc, "Approval Workflow");

      addApprovalTimeline(doc, [
        {
          title: "Submitted",
          subtitle: "Application received",
          status: "done",
        },
        {
          title: "Officer Review",
          subtitle: "Checked by officer",
          status: "done",
        },
        {
          title: "Admin Approval",
          subtitle: "Approved by admin",
          status: "done",
        },
        {
          title: isFuneralSupport ? "Finance" : "Member Action",
          subtitle: isFuneralSupport ? "Disbursement processing" : "Accept / reject offer",
          status: "pending",
        },
        {
          title: "Completed",
          subtitle: "Final record update",
          status: "pending",
        },
      ]);

      addSectionTitle(doc, "Approval Summary and Remarks");

      addFullWidthInfoTable(doc, [
        [
          "Approval Status",
          isFuneralSupport
            ? "Approved - Forwarded to Finance Processing"
            : "Approved - Waiting for Member Acceptance",
        ],
        ["Admin Approved At", formatDate(loan.adminApprovedAt)],
        ["Officer Remark", loan.officerRemark || "N/A"],
        ["Admin Remark", loan.adminRemark || "N/A"],
      ]);

      addSectionTitle(
        doc,
        isFuneralSupport ? "Finance Processing Notice" : "Member Action Required"
      );

      addParagraphBox(
        doc,
        "Important Notice",
        isFuneralSupport
          ? "Your funeral support request has been approved by Main Admin. This is a non-repayable welfare support grant. The request has been forwarded to the Finance Officer for disbursement processing. This support amount does not create an installment schedule, interest charge, repayment balance, or monthly EMI."
          : "Your loan application has been approved by Main Admin. Please review the approved loan amount, interest rate, repayment period, monthly installment, and total repayment amount carefully. If you agree with these terms, accept the offer from your member dashboard. Accepting this offer will forward your loan to the Finance Officer for disbursement processing.",
        isFuneralSupport ? "green" : "blue"
      );

      addSectionTitle(doc, "Terms and Conditions");

      const terms = isFuneralSupport
        ? [
            "This funeral support is a non-repayable welfare benefit.",
            "The approved amount is subject to finance processing and organizational welfare policy.",
            "The welfare organization may verify additional documents before final disbursement.",
            "False, invalid, or misleading documents may result in rejection or cancellation of the request.",
            "The final disbursement record will be maintained by the Finance Officer.",
          ]
        : [
            "The member must accept this loan offer before finance processing begins.",
            "The member agrees to repay the loan according to the approved repayment schedule.",
            "Monthly installments must be paid before or on the due date.",
            "Late payments may be subject to penalties according to welfare policy.",
            "The welfare organization may verify additional details before final disbursement.",
          ];

      addTerms(doc, terms);

      addSectionTitle(doc, "Authorization and Verification");

      addSignatureSection(doc, admin, referenceId, isFuneralSupport);

      addFooter(doc, documentTitle);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });

  await writeFile(filePath, pdfBuffer);

  return {
    letterUrl,
    filePath,
  };
}
