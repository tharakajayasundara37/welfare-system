import { Schema, model, models } from "mongoose";

const documentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    loanId: {
      type: Schema.Types.ObjectId,
      ref: "Loan",
      default: null,
    },

    grantId: {
      type: Schema.Types.ObjectId,
      ref: "Grant",
      default: null,
    },

    documentType: {
      type: String,
      required: true,
      enum: [
        "nicFront",
        "nicBack",
        "employeeProof",
        "salarySlip",
        "bankStatement",

        "guarantorNicFront",
        "guarantorNicBack",
        "guarantorConsentLetter",
        "loanPurposeProof",

        "deathCertificate",
        "relationshipProof",
        "funeralExpenseProof",

        "id_proof",
        "income_cert",
        "medical_report",
        "education_proof",
        "disaster_proof",
        "funeral_proof",
        "hardship_proof",
        "loan_agreement",
        "other",
      ],
    },

    label: {
      type: String,
      default: "",
      trim: true,
    },

    fileName: {
      type: String,
      required: true,
      trim: true,
    },

    originalName: {
      type: String,
      default: "",
      trim: true,
    },

    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },

    storageKey: {
      type: String,
      default: "",
      trim: true,
    },

    mimeType: {
      type: String,
      default: "",
      trim: true,
    },

    size: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["uploaded", "verified", "rejected", "pending_verification"],
      default: "uploaded",
    },

    remark: {
      type: String,
      default: "",
      trim: true,
    },

    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ userId: 1 });
documentSchema.index({ loanId: 1 });
documentSchema.index({ grantId: 1 });
documentSchema.index({ documentType: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ isDeleted: 1 });

const Document = models.Document || model("Document", documentSchema);

export default Document;