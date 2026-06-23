import { Schema, model, models } from "mongoose";

const loanSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    loanType: {
      type: String,
      required: true,
      trim: true,
      enum: [
        "Personal Loan",
        "Emergency Loan",
        "Medical Loan",
        "Education Loan",
        "Funeral Support Loan",
        "Home Loan",
        "Vehicle Loan",
        "Welfare Loan",
      ],
    },

    requestedAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    approvedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    purpose: {
      type: String,
      required: true,
      trim: true,
    },

    monthlyIncome: {
      type: Number,
      default: 0,
      min: 0,
    },

    employmentType: {
      type: String,
      default: "",
      trim: true,
      enum: ["", "Permanent", "Contract", "Temporary", "Internship", "Other"],
    },

    systemInterestRate: {
      type: Number,
      default: 0,
      min: 0,
    },

    preferredPeriodMonths: {
      type: Number,
      default: 0,
      min: 0,
    },

    approvedPeriodMonths: {
      type: Number,
      default: 0,
      min: 0,
    },

    recommendedPeriodMonths: {
      type: Number,
      default: 0,
      min: 0,
    },

    monthlyInstallment: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalRepayment: {
      type: Number,
      default: 0,
      min: 0,
    },

    remainingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    penaltyAmount: {
      type: Number,
      default: 0,
    },

    penaltyAppliedCount: {
      type: Number,
      default: 0,
    },

    lastPenaltyAppliedAt: {
      type: Date,
      default: null,
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalPaidInstallments: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalInstallments: {
      type: Number,
      default: 0,
      min: 0,
    },

    guarantorEmployeeId: {
      type: String,
      default: "",
      trim: true,
    },

    guarantorName: {
      type: String,
      default: "",
      trim: true,
    },

    guarantorPhone: {
      type: String,
      default: "",
      trim: true,
    },

    guarantorNic: {
      type: String,
      default: "",
      trim: true,
    },

    riskLevel: {
      type: String,
      enum: ["", "low", "medium", "high"],
      default: "",
    },

    eligibilityStatus: {
      type: String,
      enum: ["", "eligible", "not_eligible", "review_required"],
      default: "",
    },

    documentStatus: {
      type: String,
      enum: [
        "",
        "pending",
        "uploaded",
        "pending_verification",
        "partially_verified",
        "verified",
        "rejected",
      ],
      default: "pending",
    },

    status: {
      type: String,
      enum: [
        "draft",

        // Member apply / welfare officer flow
        "under_welfare_review",
        "pending_officer",

        // Officer to admin flow
        "pending_admin_approval",
        "pending_admin",
        "under_admin_review",

        // Admin to member offer flow
        "user_offer_pending",
        "user_accepted",
        "user_rejected",

        // Finance flow
        "pending_finance_processing",
        "pending_finance",
        "under_finance_review",

        // Final approval / lifecycle
        "approved",
        "disbursed",
        "completed",
        "defaulted",

        // General rejection
        "rejected",
        "welfare_rejected",
        "admin_rejected",
        "finance_rejected",
      ],
      default: "under_welfare_review",
    },

    userAcceptanceStatus: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },

    userAcceptedAt: {
      type: Date,
      default: null,
    },

    userRejectedAt: {
      type: Date,
      default: null,
    },

    userRejectReason: {
      type: String,
      default: "",
      trim: true,
    },

    welfareOfficerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    officerApprovedAt: {
      type: Date,
      default: null,
    },

    officerRejectedAt: {
      type: Date,
      default: null,
    },

    officerRemark: {
      type: String,
      default: "",
      trim: true,
    },

    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    adminApprovedAt: {
      type: Date,
      default: null,
    },

    adminRejectedAt: {
      type: Date,
      default: null,
    },

    adminRemark: {
      type: String,
      default: "",
      trim: true,
    },

    financeOfficerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    financeApprovedAt: {
      type: Date,
      default: null,
    },

    financeRejectedAt: {
      type: Date,
      default: null,
    },

    financeRemark: {
      type: String,
      default: "",
      trim: true,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    disbursementDate: {
      type: Date,
      default: null,
    },

    disbursementMethod: {
      type: String,
      enum: ["", "cash", "bank_transfer", "cheque", "online_transfer"],
      default: "",
      trim: true,
    },

    disbursementReference: {
      type: String,
      default: "",
      trim: true,
    },

    nextEMIDueDate: {
      type: Date,
      default: null,
    },

    lastPaymentDate: {
      type: Date,
      default: null,
    },

    loanCompletedAt: {
      type: Date,
      default: null,
    },

    officerReportUrl: {
      type: String,
      default: "",
      trim: true,
    },

    officerReportGeneratedAt: {
      type: Date,
      default: null,
    },

    approvalLetterUrl: {
      type: String,
      default: "",
      trim: true,
    },

    approvalLetterHtml: {
      type: String,
      default: "",
    },

    approvalLetterGeneratedAt: {
      type: Date,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

loanSchema.index({ userId: 1 });
loanSchema.index({ status: 1 });
loanSchema.index({ isDeleted: 1 });
loanSchema.index({ welfareOfficerId: 1 });
loanSchema.index({ adminId: 1 });
loanSchema.index({ financeOfficerId: 1 });
loanSchema.index({ userAcceptanceStatus: 1 });
loanSchema.index({ documentStatus: 1 });
loanSchema.index({ disbursementDate: -1 });
loanSchema.index({ nextEMIDueDate: 1 });
loanSchema.index({ createdAt: -1 });
loanSchema.index({ updatedAt: -1 });
loanSchema.index({ lastPenaltyAppliedAt: -1 });

const Loan = models.Loan || model("Loan", loanSchema);

export default Loan;