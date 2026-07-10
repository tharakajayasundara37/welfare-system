type SendSmsParams = {
  to: string;
  message: string;
};

type TextLkResponse = {
  status?: boolean;
  message?: string;
  data?: unknown;
};

export type SendSmsResult = {
  success: boolean;
  message: string;
  to: string;
  normalizedTo?: string;
  providerResponse?: TextLkResponse | unknown;
};

function normalizeSriLankanPhone(phone: string) {
  let value = String(phone || "").trim();

  value = value.replaceAll(" ", "");
  value = value.replaceAll("-", "");
  value = value.replaceAll("(", "");
  value = value.replaceAll(")", "");

  if (value.startsWith("+")) {
    value = value.slice(1);
  }

  if (value.startsWith("0") && value.length === 10) {
    value = `94${value.slice(1)}`;
  }

  if (value.startsWith("7") && value.length === 9) {
    value = `94${value}`;
  }

  return value;
}

function isValidSriLankanMobile(phone: string) {
  return /^947\d{8}$/.test(phone);
}

export async function sendSms({
  to,
  message,
}: SendSmsParams): Promise<SendSmsResult> {
  try {
    const apiKey = process.env.TEXTLK_API_KEY;
    const senderId = process.env.TEXTLK_SENDER_ID || "TextLKDemo";
    const apiUrl =
      process.env.TEXTLK_API_URL || "https://app.text.lk/api/v3/sms/send";

    if (!apiKey) {
      return {
        success: false,
        message: "TEXTLK_API_KEY is missing in .env.local.",
        to,
      };
    }

    if (!message.trim()) {
      return {
        success: false,
        message: "SMS message is required.",
        to,
      };
    }

    const normalizedTo = normalizeSriLankanPhone(to);

    if (!isValidSriLankanMobile(normalizedTo)) {
      return {
        success: false,
        message: `Invalid Sri Lankan mobile number: ${to}`,
        to,
        normalizedTo,
      };
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        recipient: normalizedTo,
        sender_id: senderId,
        type: "plain",
        message: message.trim(),
      }),
    });

    const contentType = response.headers.get("content-type");

    let data: TextLkResponse | unknown;

    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      return {
        success: false,
        message: `Text.lk API error. HTTP ${response.status}`,
        to,
        normalizedTo,
        providerResponse: data,
      };
    }

    const textLkData = data as TextLkResponse;

    if (textLkData.status === false) {
      return {
        success: false,
        message: textLkData.message || "Text.lk failed to queue SMS.",
        to,
        normalizedTo,
        providerResponse: textLkData,
      };
    }

    return {
      success: true,
      message: textLkData.message || "SMS queued successfully.",
      to,
      normalizedTo,
      providerResponse: textLkData,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to send SMS.",
      to,
    };
  }
}

export function buildMeetingReminderSms({
  title,
  meetingAt,
  venue,
  reason,
}: {
  title: string;
  meetingAt: Date;
  venue: string;
  reason: string;
}) {
  const timeText = meetingAt.toLocaleTimeString("en-LK", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const dateText = meetingAt.toLocaleDateString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const shortReason =
    reason.length > 70 ? `${reason.slice(0, 67)}...` : reason;

  return `Welfare Notice: ${title} is scheduled on ${dateText} at ${timeText}, ${venue}. Reason: ${shortReason}. Please attend on time.`;
}
export function buildInstallmentReminderSms({
  loanType,
  amount,
  dueDate,
}: {
  loanType: string;
  amount: number;
  dueDate: Date;
}) {
  const dateText = dueDate.toLocaleDateString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return `Welfare Reminder: Your ${loanType} installment of Rs. ${Number(
    amount
  ).toLocaleString()} is due tomorrow (${dateText}). Please pay on time.`;
}
export function buildLoanIssuedSms({
  loanType,
  amount,
}: {
  loanType: string;
  amount: number;
}) {
  return `Welfare Notice: Your ${loanType} of Rs. ${Number(
    amount
  ).toLocaleString()} has been approved and disbursed by the Finance Officer.`;
}
// Dawasata kalin yawana reminder SMS eka
export function buildPreDueDateSms({
  amount,
  dueDate,
}: {
  amount: number;
  dueDate: Date;
}) {
  const dateText = new Date(dueDate).toLocaleDateString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `Welfare Reminder: Your loan installment of Rs. ${Number(
    amount
  ).toLocaleString()} is due tomorrow (${dateText}). Please make the payment to avoid penalties.`;
}

// Dawas 3kata passe penalty add wunama yawana SMS eka
export function buildPenaltyWarningSms({
  penaltyRate,
  penaltyAmount,
}: {
  penaltyRate: number;
  penaltyAmount: number;
}) {
  return `Welfare Notice: Your loan installment is 3 days overdue. A penalty of ${penaltyRate}% (Rs. ${Number(
    penaltyAmount
  ).toLocaleString()}) has been applied. Please pay immediately.`;
}