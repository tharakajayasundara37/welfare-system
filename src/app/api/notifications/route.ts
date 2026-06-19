import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";
import Notification from "@/models/Notification";

type NotificationDoc = {
  _id: Types.ObjectId;
  title: string;
  message: string;
  type: string;
  priority: string;
  isRead: boolean;
  link?: string;
  createdAt: Date;
};

type CreateNotificationBody = {
  userId?: string;
  title?: string;
  message?: string;
  type?: string;
  priority?: string;
  link?: string;
  metadata?: Record<string, unknown>;
};

function toObjectId(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return new Types.ObjectId(id);
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const currentUser = await getCurrentUser();

    if (!currentUser?._id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userObjectId = toObjectId(currentUser._id);

    if (!userObjectId) {
      return NextResponse.json(
        { success: false, message: "Invalid user id" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);

    const page = Math.max(Number(searchParams.get("page") || "1"), 1);
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit") || "20"), 1),
      100
    );

    const type = searchParams.get("type");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const query: Record<string, unknown> = {
      userId: userObjectId,
      status: "active",
      isDeleted: false,
    };

    if (type && type !== "all") {
      query.type = type;
    }

    if (unreadOnly) {
      query.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<NotificationDoc[]>(),

      Notification.countDocuments(query),

      Notification.countDocuments({
        userId: userObjectId,
        status: "active",
        isDeleted: false,
        isRead: false,
      }),
    ]);

    return NextResponse.json({
      success: true,
      notifications: notifications.map((notification) => ({
        _id: notification._id.toString(),
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        isRead: notification.isRead,
        link: notification.link || "",
        createdAt: notification.createdAt,
      })),
      total,
      unreadCount,
      page,
      limit,
      currentUserId: currentUser._id,
    });
  } catch (error) {
    console.error("GET_NOTIFICATIONS_ERROR", error);

    return NextResponse.json(
      { success: false, message: "Failed to load notifications" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const currentUser = await getCurrentUser();

    if (!currentUser?._id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as CreateNotificationBody;

    if (!body.title || !body.message) {
      return NextResponse.json(
        { success: false, message: "Title and message are required" },
        { status: 400 }
      );
    }

    const targetUserId = body.userId || currentUser._id;
    const targetObjectId = toObjectId(targetUserId);

    if (!targetObjectId) {
      return NextResponse.json(
        { success: false, message: "Invalid target user id" },
        { status: 400 }
      );
    }

    const notification = await Notification.create({
      userId: targetObjectId,
      title: body.title,
      message: body.message,
      type: body.type || "system",
      priority: body.priority || "normal",
      link: body.link || "",
      metadata: body.metadata || {},
      status: "active",
      isDeleted: false,
    });

    return NextResponse.json({
      success: true,
      message: "Notification created successfully",
      notification: {
        _id: notification._id.toString(),
        userId: notification.userId.toString(),
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        isRead: notification.isRead,
        link: notification.link || "",
        createdAt: notification.createdAt,
      },
    });
  } catch (error) {
    console.error("POST_NOTIFICATIONS_ERROR", error);

    return NextResponse.json(
      { success: false, message: "Failed to create notification" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();

    const currentUser = await getCurrentUser();

    if (!currentUser?._id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userObjectId = toObjectId(currentUser._id);

    if (!userObjectId) {
      return NextResponse.json(
        { success: false, message: "Invalid user id" },
        { status: 400 }
      );
    }

    const body = (await req.json()) as {
      notificationIds?: string[];
      markAll?: boolean;
    };

    if (body.markAll) {
      await Notification.updateMany(
        {
          userId: userObjectId,
          isRead: false,
          status: "active",
          isDeleted: false,
        },
        {
          isRead: true,
          readAt: new Date(),
        }
      );
    } else if (body.notificationIds && body.notificationIds.length > 0) {
      await Notification.updateMany(
        {
          _id: {
            $in: body.notificationIds
              .filter((id) => Types.ObjectId.isValid(id))
              .map((id) => new Types.ObjectId(id)),
          },
          userId: userObjectId,
          status: "active",
          isDeleted: false,
        },
        {
          isRead: true,
          readAt: new Date(),
        }
      );
    }

    const unreadCount = await Notification.countDocuments({
      userId: userObjectId,
      isRead: false,
      status: "active",
      isDeleted: false,
    });

    return NextResponse.json({
      success: true,
      message: "Notification updated successfully",
      unreadCount,
    });
  } catch (error) {
    console.error("PATCH_NOTIFICATIONS_ERROR", error);

    return NextResponse.json(
      { success: false, message: "Failed to update notification" },
      { status: 500 }
    );
  }
}