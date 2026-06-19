import { Schema, model, models } from "mongoose";

const monthlyPaymentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    year: {
      type: Number,
      required: true,
      min: 2000,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["pending", "paid", "overdue", "failed"],
      default: "pending",
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: [
        "",
        "mock_card",
        "mock_bank_transfer",
        "cash",
        "bank_transfer",
      ],
      default: "",
      trim: true,
    },

    transactionReference: {
      type: String,
      default: "",
      trim: true,
    },

    receiptNumber: {
      type: String,
      default: "",
      trim: true,
    },

    cardHolderName: {
      type: String,
      default: "",
      trim: true,
    },

    maskedCardNumber: {
      type: String,
      default: "",
      trim: true,
    },

    dueDate: {
      type: Date,
      default: null,
    },

    overdueAt: {
      type: Date,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    remark: {
      type: String,
      default: "",
      trim: true,
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

monthlyPaymentSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });
monthlyPaymentSchema.index({ status: 1 });
monthlyPaymentSchema.index({ paidAt: -1 });
monthlyPaymentSchema.index({ dueDate: 1 });
monthlyPaymentSchema.index({ createdAt: -1 });

const MonthlyPayment =
  models.MonthlyPayment || model("MonthlyPayment", monthlyPaymentSchema);

export default MonthlyPayment;