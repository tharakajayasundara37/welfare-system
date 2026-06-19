import { Schema, model, models } from "mongoose";

const meetingNoticeSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: "Staff Meeting",
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    venue: {
      type: String,
      default: "Main Hall",
      trim: true,
    },

    meetingDate: {
      type: String,
      required: true,
      trim: true,
    },

    meetingTime: {
      type: String,
      required: true,
      trim: true,
    },

    meetingAt: {
      type: Date,
      required: true,
    },

    priority: {
      type: String,
      enum: ["normal", "important", "urgent"],
      default: "normal",
    },

    targetAudience: {
      type: String,
      enum: ["all_members", "active_members", "officers"],
      default: "all_members",
    },

    cardTheme: {
      type: String,
      enum: ["welfare_brown", "blue_notice"],
      default: "welfare_brown",
    },

    smsReminderEnabled: {
      type: Boolean,
      default: false,
    },

    smsReminderSent: {
      type: Boolean,
      default: false,
    },

    smsReminderSentAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
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

meetingNoticeSchema.index({ meetingAt: 1 });
meetingNoticeSchema.index({ status: 1 });
meetingNoticeSchema.index({ isDeleted: 1 });
meetingNoticeSchema.index({ createdBy: 1 });

const MeetingNotice =
  models.MeetingNotice || model("MeetingNotice", meetingNoticeSchema);

export default MeetingNotice;