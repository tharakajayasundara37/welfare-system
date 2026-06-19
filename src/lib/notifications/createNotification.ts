import { Types } from "mongoose";

import dbConnect from "@/lib/dbConnect";
import Notification from "@/models/Notification";

type NotificationType =
  | "loan"
  | "grant"
  | "payment"
  | "meeting"
  | "system"
  | "offer"
  | "document"
  | "approval";

type NotificationPriority = "low" | "normal" | "high" | "urgent";

type CreateNotificationInput = {
  userId: string | Types.ObjectId;
  type?: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  link?: string;
  metadata?: Record<string, unknown>;
};

export async function createNotification(input: CreateNotificationInput) {
  await dbConnect();

  const userId =
    typeof input.userId === "string"
      ? new Types.ObjectId(input.userId)
      : input.userId;

  return Notification.create({
    userId,
    type: input.type || "system",
    title: input.title,
    message: input.message,
    priority: input.priority || "normal",
    link: input.link || "",
    metadata: input.metadata || {},
    isRead: false,
    status: "active",
    isDeleted: false,
  });
}