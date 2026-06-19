import mongoose, { Schema, model, models } from "mongoose";

const loanSettingSchema = new Schema(
  {
    interestRate: {
      type: Number,
      required: true,
      default: 12,
      min: 0,
    },

    minimumLoanAmount: {
      type: Number,
      required: true,
      default: 10000,
      min: 0,
    },

    maximumLoanAmount: {
      type: Number,
      required: true,
      default: 500000,
      min: 0,
    },

    funeralSupportMaxAmount: {
      type: Number,
      required: true,
      default: 100000,
      min: 0,
    },

    allowedRepaymentPeriods: {
      type: [Number],
      required: true,
      default: [6, 12, 18, 24, 30, 36, 42, 48, 54],
    },

    latePaymentPenaltyRate: {
      type: Number,
      required: true,
      default: 2,
      min: 0,
    },

    monthlyFeeAmount: {
      type: Number,
      required: true,
      default: 1000,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

loanSettingSchema.index({ isActive: 1 });
loanSettingSchema.index({ createdAt: -1 });

const LoanSetting =
  models.LoanSetting || model("LoanSetting", loanSettingSchema);

export default LoanSetting;