"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  Loader2,
  RefreshCcw,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Disbursement = {
  _id: string;
  memberName: string;
  memberEmail: string;
  memberPhone: string;
  employeeId: string;
  loanType: string;
  approvedAmount: number;
  approvedPeriodMonths: number;
  monthlyInstallment: number;
  totalRepayment: number;
  remainingBalance: number;
  status: string;
  disbursementStatus: "pending_disbursement" | "disbursed";
  approvedAt?: string;
  acceptedAt?: string;
  disbursedAt?: string;
  disbursementMethod?: string;
  disbursementReference?: string;
};

type ApiResponse = {
  success: boolean;
  disbursements: Disbursement[];
  message?: string;
};

export default function FinanceDisbursementsPage() {
  const [items, setItems] = useState<Disbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const initialized = useRef(false);

  async function loadDisbursements() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/finance/disbursements", {
        cache: "no-store",
      });

      const data = (await res.json()) as ApiResponse;

      if (!data.success) {
        setError(data.message || "Failed to load disbursements");
        return;
      }

      setItems(data.disbursements);
    } catch {
      setError("Something went wrong while loading disbursements");
    } finally {
      setLoading(false);
    }
  }

  async function markAsDisbursed(id: string) {
    try {
      setActionLoadingId(id);
      setError("");

      const defaultReference = `DISB-${crypto
        .randomUUID()
        .slice(0, 8)
        .toUpperCase()}`;

      const reference = window.prompt(
        "Enter disbursement reference number:",
        defaultReference
      );

      if (reference === null) return;

      const res = await fetch(`/api/finance/disbursements/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          disbursementMethod: "bank_transfer",
          disbursementReference: reference,
          financeRemark: "Loan disbursed by finance officer.",
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Failed to mark as disbursed");
        return;
      }

      await loadDisbursements();
    } catch {
      setError("Something went wrong while marking disbursement");
    } finally {
      setActionLoadingId("");
    }
  }

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    void loadDisbursements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return items;

    return items.filter((item) => {
      return (
        item.memberName.toLowerCase().includes(query) ||
        item.loanType.toLowerCase().includes(query) ||
        item.employeeId.toLowerCase().includes(query) ||
        item.status.toLowerCase().includes(query)
      );
    });
  }, [items, search]);

  const pendingCount = items.filter(
    (item) => item.disbursementStatus === "pending_disbursement"
  ).length;

  const disbursedCount = items.filter(
    (item) => item.disbursementStatus === "disbursed"
  ).length;

  const totalAmount = items.reduce(
    (sum, item) => sum + Number(item.approvedAmount || 0),
    0
  );

  return (
    <div className="min-h-screen rounded-[34px] bg-[#eee6da] p-6 text-[#2b241f]">
      <div className="mb-6 flex flex-col justify-between gap-4 rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-6 shadow-lg lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Banknote className="text-[#9b6f45]" />
            <h1 className="text-3xl font-extrabold">Loan Disbursements</h1>
          </div>

          <p className="mt-2 text-sm text-[#6b5e54]">
            Process member accepted loans and mark them as disbursed.
          </p>
        </div>

        <Button onClick={loadDisbursements} variant="outline">
          <RefreshCcw size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-[#d9c8b8] bg-[#fbf7ef]">
          <CardContent className="p-5">
            <p className="text-sm text-[#6b5e54]">Pending Disbursement</p>
            <h2 className="mt-2 text-3xl font-extrabold">{pendingCount}</h2>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-[#d9c8b8] bg-[#fbf7ef]">
          <CardContent className="p-5">
            <p className="text-sm text-[#6b5e54]">Disbursed</p>
            <h2 className="mt-2 text-3xl font-extrabold">{disbursedCount}</h2>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-[#d9c8b8] bg-[#fbf7ef]">
          <CardContent className="p-5">
            <p className="text-sm text-[#6b5e54]">Total Amount</p>
            <h2 className="mt-2 text-3xl font-extrabold">
              Rs. {totalAmount.toLocaleString()}
            </h2>
          </CardContent>
        </Card>
      </div>

      <div className="mb-5 flex items-center gap-3 rounded-3xl border border-[#d9c8b8] bg-[#fbf7ef] p-4">
        <Search size={18} className="text-[#9b6f45]" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by member, loan type, employee ID or status..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-[#9b6f45]/60"
        />
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="animate-spin text-[#9b6f45]" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <Card className="rounded-3xl border-[#d9c8b8] bg-[#fbf7ef]">
              <CardContent className="p-10 text-center text-[#6b5e54]">
                No disbursements found.
              </CardContent>
            </Card>
          ) : (
            filteredItems.map((item) => (
              <Card
                key={item._id}
                className="rounded-3xl border-[#d9c8b8] bg-[#fbf7ef]"
              >
                <CardContent className="flex flex-col justify-between gap-4 p-5 xl:flex-row xl:items-center">
                  <div>
                    <h3 className="text-lg font-extrabold">
                      {item.memberName}
                    </h3>

                    <p className="text-sm text-[#6b5e54]">
                      {item.loanType} • Rs.{" "}
                      {item.approvedAmount.toLocaleString()}
                    </p>

                    <p className="mt-1 text-xs text-[#8b7a6d]">
                      EMI: Rs. {item.monthlyInstallment.toLocaleString()} •
                      Period: {item.approvedPeriodMonths} months
                    </p>

                    <p className="mt-1 text-xs text-[#8b7a6d]">
                      Accepted:{" "}
                      {item.acceptedAt
                        ? new Date(item.acceptedAt).toLocaleDateString()
                        : "N/A"}
                    </p>

                    {item.disbursementReference && (
                      <p className="mt-1 text-xs text-[#8b7a6d]">
                        Ref: {item.disbursementReference}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        item.disbursementStatus === "disbursed"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {item.disbursementStatus === "disbursed"
                        ? "Disbursed"
                        : "Pending"}
                    </span>

                    {item.disbursementStatus === "pending_disbursement" && (
                      <Button
                        onClick={() => markAsDisbursed(item._id)}
                        disabled={actionLoadingId === item._id}
                        className="bg-[#9b6f45] text-white hover:bg-[#835c38]"
                      >
                        {actionLoadingId === item._id ? (
                          <Loader2 size={16} className="mr-2 animate-spin" />
                        ) : (
                          <CheckCircle2 size={16} className="mr-2" />
                        )}
                        Mark Disbursed
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}