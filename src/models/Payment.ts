import mongoose, { Schema, model, models } from "mongoose";

const paymentSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    paymentType: {
      type: String,
      enum: ["monthly_fee", "loan_installment"],
      required: true,
      default: "monthly_fee",
    },

    month: {
      type: Number,
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      default: 500,
    },

    status: {
      type: String,
      enum: ["pending", "paid", "failed", "overdue"],
      default: "pending",
    },

    dueDate: {
      type: Date,
      required: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    paymentMethod: {
      type: String,
      default: "",
    },

    transactionReference: {
      type: String,
      default: "",
    },

    receiptNumber: {
      type: String,
      default: "",
    },

    verifiedByFinance: {
      type: Boolean,
      default: false,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

paymentSchema.index(
  { userId: 1, paymentType: 1, month: 1, year: 1 },
  { unique: true }
);

const Payment = models.Payment || model("Payment", paymentSchema);

export default Payment;