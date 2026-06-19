import { Schema, model, models } from "mongoose";

const grantDocumentSchema = new Schema(
  {
    documentType: {
      type: String,
      required: true,
      trim: true,
    },

    fileName: {
      type: String,
      required: true,
      trim: true,
    },

    fileUrl: {
      type: String,
      required: true,
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
  },
  {
    _id: false,
  }
);

const grantSchema = new Schema(
  {
    grantId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    memberId: {
      type: String,
      required: true,
      trim: true,
    },

    memberName: {
      type: String,
      required: true,
      trim: true,
    },

    memberEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },

    emergencyPhoneNumber: {
      type: String,
      required: true,
      trim: true,
    },

    grantType: {
      type: String,
      required: true,
      enum: [
        "Medical Grant",
        "Education Grant",
        "Funeral Support Grant",
        "Disaster Relief Grant",
        "Hardship Grant",
      ],
    },

    requestedAmount: {
      type: Number,
      required: true,
      min: 1,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    relationshipWithDeceased: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "pending_officer",
        "pending_admin",
        "pending_finance",
        "approved",
        "rejected",
        "disbursed",
      ],
      default: "pending_officer",
    },

    priorityLevel: {
      type: String,
      enum: ["normal", "high", "emergency"],
      default: "normal",
    },

    documents: {
      type: [grantDocumentSchema],
      default: [],
    },

    officerReview: {
      reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      reviewedAt: {
        type: Date,
        default: null,
      },
      decision: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      note: {
        type: String,
        default: "",
        trim: true,
      },
    },

    adminApproval: {
      approvedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      approvedAt: {
        type: Date,
        default: null,
      },
      decision: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      note: {
        type: String,
        default: "",
        trim: true,
      },
    },

    financeDisbursement: {
      processedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      processedAt: {
        type: Date,
        default: null,
      },
      disbursedAmount: {
        type: Number,
        default: 0,
      },
      transactionReference: {
        type: String,
        default: "",
        trim: true,
      },
      note: {
        type: String,
        default: "",
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

grantSchema.index({ userId: 1, createdAt: -1 });
grantSchema.index({ grantId: 1 });
grantSchema.index({ status: 1 });

const Grant = models.Grant || model("Grant", grantSchema);

export default Grant;