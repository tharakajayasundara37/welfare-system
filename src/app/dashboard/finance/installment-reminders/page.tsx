"use client";

import { useState } from "react";
import {
  BellRing,
  CheckCircle2,
  Loader2,
  MessageSquareText,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ReminderResult = {
  installmentId: string;
  userId: string;
  memberName: string;
  phone: string;
  smsSent: boolean;
  message: string;
};

type ApiResponse = {
  success: boolean;
  message: string;
  totalFound?: number;
  sentCount?: number;
  failedCount?: number;
  results?: ReminderResult[];
};

export default function FinanceInstallmentRemindersPage() {
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState("");

  async function sendReminders() {
    try {
      setSending(true);
      setError("");
      setResponse(null);

      const res = await fetch("/api/finance/installment-reminders/run", {
        method: "POST",
        cache: "no-store",
      });

      const data = (await res.json()) as ApiResponse;

      if (!data.success) {
        setError(data.message || "Failed to send reminders.");
        return;
      }

      setResponse(data);
    } catch {
      setError("Something went wrong while sending reminders.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen rounded-[34px] bg-[#eee6da] p-6 text-[#2b241f]">
      <Card className="rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 shadow-lg">
        <CardContent className="p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1e5d8] text-[#9b6f45]">
              <BellRing size={28} />
            </div>

            <div>
              <h1 className="text-3xl font-extrabold">
                Installment SMS Reminders
              </h1>
              <p className="mt-1 text-sm text-[#6b5e54]">
                Send SMS reminders for installments due tomorrow.
              </p>
            </div>
          </div>

          <Button
            onClick={sendReminders}
            disabled={sending}
            className="mt-7 rounded-2xl bg-[#9b6f45] px-6 text-white hover:bg-[#835c38]"
          >
            {sending ? (
              <Loader2 size={18} className="mr-2 animate-spin" />
            ) : (
              <MessageSquareText size={18} className="mr-2" />
            )}
            {sending ? "Sending Reminders..." : "Send Reminders Now"}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-100 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {response && (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card className="rounded-3xl border-[#d9c8b8] bg-[#fbf7ef]">
            <CardContent className="p-5">
              <p className="text-sm text-[#6b5e54]">Found</p>
              <h2 className="mt-2 text-3xl font-extrabold">
                {response.totalFound || 0}
              </h2>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-[#d9c8b8] bg-[#fbf7ef]">
            <CardContent className="p-5">
              <p className="text-sm text-[#6b5e54]">Sent</p>
              <h2 className="mt-2 flex items-center gap-2 text-3xl font-extrabold text-green-700">
                <CheckCircle2 size={26} />
                {response.sentCount || 0}
              </h2>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-[#d9c8b8] bg-[#fbf7ef]">
            <CardContent className="p-5">
              <p className="text-sm text-[#6b5e54]">Failed</p>
              <h2 className="mt-2 flex items-center gap-2 text-3xl font-extrabold text-red-700">
                <XCircle size={26} />
                {response.failedCount || 0}
              </h2>
            </CardContent>
          </Card>
        </div>
      )}

      {response?.results && response.results.length > 0 && (
        <Card className="mt-6 rounded-3xl border-[#d9c8b8] bg-[#fbf7ef]">
          <CardContent className="p-5">
            <h2 className="mb-4 text-xl font-extrabold">Results</h2>

            <div className="space-y-3">
              {response.results.map((item) => (
                <div
                  key={item.installmentId}
                  className="rounded-2xl border border-[#d9c8b8] bg-[#fffaf3] p-4"
                >
                  <p className="text-sm font-bold">
                    Member: {item.memberName || "-"}
                  </p>
                  <p className="text-sm font-bold">
                    Phone: {item.phone || "-"}
                  </p>
                  <p
                    className={`mt-1 text-sm font-semibold ${
                      item.smsSent ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {item.smsSent ? "Sent" : "Failed"} - {item.message}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}