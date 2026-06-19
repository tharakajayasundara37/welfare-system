import { Schema, model, models } from "mongoose";

const installmentSchema = new Schema(
  {
    loanId: {
      type: Schema.Types.ObjectId,
      ref: "Loan",
      required: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    installmentNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    dueDate: {
      type: Date,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["pending", "paid", "overdue"],
      default: "pending",
      index: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    paymentReference: {
      type: String,
      default: "",
      trim: true,
    },

    reminderSent: {
      type: Boolean,
      default: false,
    },

    reminderSentAt: {
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

installmentSchema.index(
  {
    loanId: 1,
    installmentNumber: 1,
  },
  {
    unique: true,
  }
);

installmentSchema.index({
  userId: 1,
  dueDate: 1,
});

installmentSchema.index({
  status: 1,
  dueDate: 1,
});

const Installment =
  models.Installment || model("Installment", installmentSchema);

export default Installment;