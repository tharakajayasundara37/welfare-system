import { Schema, model, models } from "mongoose";

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    nic: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      default: "",
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    employeeId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    companyName: {
      type: String,
      default: "",
      trim: true,
    },

    department: {
      type: String,
      default: "",
      trim: true,
    },

    jobRole: {
      type: String,
      default: "",
      trim: true,
    },

    salaryRange: {
      type: String,
      default: "",
      trim: true,
    },

    role: {
      type: String,
      enum: ["member", "admin", "welfare_officer", "finance_officer"],
      default: "member",
    },

    accountStatus: {
      type: String,
      enum: ["pending_admin_approval", "active", "rejected", "suspended"],
      default: "pending_admin_approval",
    },

    profileImage: {
      type: String,
      default: "",
      trim: true,
    },

    themeMode: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },

    themeColor: {
      type: String,
      default: "#9b6f45",
      trim: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ accountStatus: 1 });

const User = models.User || model("User", userSchema);

export default User;