import mongoose from "mongoose";

import dbConnect from "@/lib/dbConnect";
import Notification from "@/models/Notification";

export interface CreateNotificationParams {
  userId: string | mongoose.Types.ObjectId;
  type: "loan" | "grant" | "payment" | "meeting" | "system" | "offer" | "document" | "approval";
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
  priority?: "low" | "normal" | "high" | "urgent";
}

/**
 * Create a single notification
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  link = "",
  metadata = {},
  priority = "normal",
}: CreateNotificationParams) {
  try {
    await dbConnect();

    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      link,
      metadata,
      priority,
      status: "active",
      isRead: false,
    });

    return notification;
  } catch (error) {
    console.error("CREATE_NOTIFICATION_ERROR", error);
    return null;
  }
}

/**
 * Create multiple notifications at once
 */
export async function createManyNotifications(notifications: CreateNotificationParams[]) {
  try {
    await dbConnect();

    if (!notifications.length) {
      return [];
    }

    const docs = notifications.map((n) => ({
      userId: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link || "",
      metadata: n.metadata || {},
      priority: n.priority || "normal",
      status: "active",
      isRead: false,
    }));

    const result = await Notification.insertMany(docs);
    return result;
  } catch (error) {
    console.error("CREATE_MANY_NOTIFICATIONS_ERROR", error);
    return [];
  }
}