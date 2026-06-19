"use client";

import { useEffect, useState } from "react";

import {
  BadgeDollarSign,
  Gift,
  Loader2,
  Save,
  Settings,
  SlidersHorizontal,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoanSettings {
  interestRate: number;
  minimumLoanAmount: number;
  maximumLoanAmount: number;
  funeralSupportMaxAmount: number;
  allowedRepaymentPeriods: number[];
  latePaymentPenaltyRate: number;
  monthlyFeeAmount: number;
}

interface LoanSettingsResponse {
  success: boolean;
  message?: string;
  settings?: LoanSettings;
}

const repaymentPeriodOptions = [6, 12, 18, 24, 30, 36, 42, 48, 54];

export default function AdminLoanSettingsPage() {
  const [settings, setSettings] = useState<LoanSettings>({
    interestRate: 12,
    minimumLoanAmount: 10000,
    maximumLoanAmount: 500000,
    funeralSupportMaxAmount: 100000,
    allowedRepaymentPeriods: [6, 12, 18, 24, 30, 36, 42, 48, 54],
    latePaymentPenaltyRate: 2,
    monthlyFeeAmount: 1000,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);

        const response = await fetch("/api/admin/loan-settings", {
          method: "GET",
          cache: "no-store",
        });

        const contentType = response.headers.get("content-type");

        if (!contentType?.includes("application/json")) {
          throw new Error("API returned HTML instead of JSON");
        }

        const result = (await response.json()) as LoanSettingsResponse;

        if (!result.success || !result.settings) {
          setIsSuccess(false);
          setMessage(result.message || "Failed to load loan settings");
          return;
        }

        setSettings({
          interestRate: result.settings.interestRate ?? 12,
          minimumLoanAmount: result.settings.minimumLoanAmount ?? 10000,
          maximumLoanAmount: result.settings.maximumLoanAmount ?? 500000,
          funeralSupportMaxAmount:
            result.settings.funeralSupportMaxAmount ?? 100000,
          allowedRepaymentPeriods:
            result.settings.allowedRepaymentPeriods ?? [
              6, 12, 18, 24, 30, 36, 42, 48, 54,
            ],
          latePaymentPenaltyRate: result.settings.latePaymentPenaltyRate ?? 2,
          monthlyFeeAmount: result.settings.monthlyFeeAmount ?? 1000,
        });
      } catch (error) {
        console.error("LOAD_LOAN_SETTINGS_ERROR", error);
        setIsSuccess(false);
        setMessage("Something went wrong while loading loan settings");
      } finally {
        setLoading(false);
      }
    }

    void loadSettings();
  }, []);

  const updateNumberField = (
    key: keyof Omit<LoanSettings, "allowedRepaymentPeriods">,
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: Number(value),
    }));
  };

  const toggleRepaymentPeriod = (period: number) => {
    setSettings((prev) => {
      const alreadySelected = prev.allowedRepaymentPeriods.includes(period);

      if (alreadySelected) {
        return {
          ...prev,
          allowedRepaymentPeriods: prev.allowedRepaymentPeriods.filter(
            (item) => item !== period
          ),
        };
      }

      return {
        ...prev,
        allowedRepaymentPeriods: [
          ...prev.allowedRepaymentPeriods,
          period,
        ].sort((a, b) => a - b),
      };
    });
  };

  const validateSettings = () => {
    if (settings.interestRate < 0) {
      return "Interest rate cannot be negative";
    }

    if (settings.minimumLoanAmount < 0) {
      return "Minimum loan amount cannot be negative";
    }

    if (settings.maximumLoanAmount < 0) {
      return "Maximum loan amount cannot be negative";
    }

    if (settings.funeralSupportMaxAmount < 0) {
      return "Funeral support maximum amount cannot be negative";
    }

    if (settings.minimumLoanAmount > settings.maximumLoanAmount) {
      return "Minimum loan amount cannot be greater than maximum loan amount";
    }

    if (settings.allowedRepaymentPeriods.length === 0) {
      return "Please select at least one repayment period";
    }

    if (settings.latePaymentPenaltyRate < 0) {
      return "Late payment penalty rate cannot be negative";
    }

    if (settings.monthlyFeeAmount < 0) {
      return "Monthly fee amount cannot be negative";
    }

    return "";
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage("");

      const validationError = validateSettings();

      if (validationError) {
        setIsSuccess(false);
        setMessage(validationError);
        return;
      }

      const response = await fetch("/api/admin/loan-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const contentType = response.headers.get("content-type");

      if (!contentType?.includes("application/json")) {
        throw new Error("API returned HTML instead of JSON");
      }

      const result = (await response.json()) as LoanSettingsResponse;

      if (!result.success) {
        setIsSuccess(false);
        setMessage(result.message || "Failed to update loan settings");
        return;
      }

      if (result.settings) {
        setSettings({
          interestRate: result.settings.interestRate,
          minimumLoanAmount: result.settings.minimumLoanAmount,
          maximumLoanAmount: result.settings.maximumLoanAmount,
          funeralSupportMaxAmount: result.settings.funeralSupportMaxAmount,
          allowedRepaymentPeriods: result.settings.allowedRepaymentPeriods,
          latePaymentPenaltyRate: result.settings.latePaymentPenaltyRate,
          monthlyFeeAmount: result.settings.monthlyFeeAmount,
        });
      }

      setIsSuccess(true);
      setMessage("Loan settings updated successfully");
    } catch (error) {
      console.error("SAVE_LOAN_SETTINGS_ERROR", error);
      setIsSuccess(false);
      setMessage("Something went wrong while saving loan settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#eee6da] text-[#2b241f]">
        <Loader2 className="mr-2 animate-spin text-[#9b6f45]" />
        Loading loan settings...
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden rounded-[34px] bg-[#eee6da] text-[#2b241f]">
      <div className="relative min-h-screen space-y-7 overflow-hidden p-1">
        <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] rounded-full bg-[#c99b69]/25 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-[480px] w-[480px] rounded-full bg-[#2c241f]/10 blur-[140px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-[360px] w-[360px] rounded-full bg-[#d8ad80]/25 blur-[130px]" />

        <section className="relative overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-7 shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#d8ad80]/25 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-[#9b6f45]">
                Administration Panel
              </p>

              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#2b241f] md:text-5xl">
                Loan Settings
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b5e54]">
                Configure interest rate, repayment periods, loan limits,
                penalties, funeral support limit and monthly welfare fee.
              </p>
            </div>

            <Button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="rounded-2xl bg-[#2c241f] px-5 text-[#fbf7ef] shadow-lg shadow-[#2c241f]/20 transition hover:bg-[#9b6f45] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={18} />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2" size={18} />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </section>

        {message && (
          <div
            className={`relative rounded-2xl border p-4 text-sm font-semibold ${
              isSuccess
                ? "border-emerald-600/25 bg-emerald-100 text-emerald-700"
                : "border-red-500/20 bg-red-100 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        <div className="relative grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
              <CardContent className="relative p-6">
                <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#d8ad80]/20 blur-3xl" />

                <div className="relative mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-[#9b6f45] shadow-lg shadow-[#2c241f]/10">
                    <SlidersHorizontal size={22} />
                  </div>

                  <div>
                    <h2 className="text-2xl font-extrabold text-[#2b241f]">
                      Financial Rules
                    </h2>
                    <p className="text-sm text-[#6b5e54]">
                      These values are used by the loan apply API, EMI
                      calculation and funeral support validation.
                    </p>
                  </div>
                </div>

                <div className="relative grid gap-5 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-semibold text-[#6b5e54]">
                      Interest Rate (%)
                    </Label>

                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={settings.interestRate}
                      onChange={(event) =>
                        updateNumberField("interestRate", event.target.value)
                      }
                      className="mt-2 h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/80 text-[#2b241f] placeholder:text-[#9b6f45]/55 focus-visible:ring-[#9b6f45]/30"
                    />

                    <p className="mt-2 text-xs text-[#79695d]">
                      Example: 12 means 12% annual loan interest.
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-[#6b5e54]">
                      Late Payment Penalty Rate (%)
                    </Label>

                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={settings.latePaymentPenaltyRate}
                      onChange={(event) =>
                        updateNumberField(
                          "latePaymentPenaltyRate",
                          event.target.value
                        )
                      }
                      className="mt-2 h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/80 text-[#2b241f] placeholder:text-[#9b6f45]/55 focus-visible:ring-[#9b6f45]/30"
                    />

                    <p className="mt-2 text-xs text-[#79695d]">
                      Applied when installments become overdue.
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-[#6b5e54]">
                      Minimum Loan Amount (LKR)
                    </Label>

                    <Input
                      type="number"
                      min="0"
                      value={settings.minimumLoanAmount}
                      onChange={(event) =>
                        updateNumberField(
                          "minimumLoanAmount",
                          event.target.value
                        )
                      }
                      className="mt-2 h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/80 text-[#2b241f] placeholder:text-[#9b6f45]/55 focus-visible:ring-[#9b6f45]/30"
                    />

                    <p className="mt-2 text-xs text-[#79695d]">
                      Users cannot apply below this amount.
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-[#6b5e54]">
                      Maximum Loan Amount (LKR)
                    </Label>

                    <Input
                      type="number"
                      min="0"
                      value={settings.maximumLoanAmount}
                      onChange={(event) =>
                        updateNumberField(
                          "maximumLoanAmount",
                          event.target.value
                        )
                      }
                      className="mt-2 h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/80 text-[#2b241f] placeholder:text-[#9b6f45]/55 focus-visible:ring-[#9b6f45]/30"
                    />

                    <p className="mt-2 text-xs text-[#79695d]">
                      Users cannot apply above this amount for repayable loans.
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-[#6b5e54]">
                      Funeral Support Max Amount (LKR)
                    </Label>

                    <Input
                      type="number"
                      min="0"
                      value={settings.funeralSupportMaxAmount}
                      onChange={(event) =>
                        updateNumberField(
                          "funeralSupportMaxAmount",
                          event.target.value
                        )
                      }
                      className="mt-2 h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/80 text-[#2b241f] placeholder:text-[#9b6f45]/55 focus-visible:ring-[#9b6f45]/30"
                    />

                    <p className="mt-2 text-xs font-semibold text-emerald-700">
                      Default is LKR 100,000. Used only for Funeral Support
                      Grant.
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-[#6b5e54]">
                      Monthly Welfare Fee Amount (LKR)
                    </Label>

                    <Input
                      type="number"
                      min="0"
                      value={settings.monthlyFeeAmount}
                      onChange={(event) =>
                        updateNumberField(
                          "monthlyFeeAmount",
                          event.target.value
                        )
                      }
                      className="mt-2 h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/80 text-[#2b241f] placeholder:text-[#9b6f45]/55 focus-visible:ring-[#9b6f45]/30"
                    />

                    <p className="mt-2 text-xs text-[#79695d]">
                      Used later for monthly welfare fee generation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
              <CardContent className="relative p-6">
                <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#2c241f]/10 blur-3xl" />

                <div className="relative mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f6eadc] text-[#9b6f45] shadow-lg shadow-[#2c241f]/10">
                    <Settings size={22} />
                  </div>

                  <div>
                    <h2 className="text-2xl font-extrabold text-[#2b241f]">
                      Allowed Repayment Periods
                    </h2>
                    <p className="text-sm text-[#6b5e54]">
                      These periods appear in the member loan apply form.
                    </p>
                  </div>
                </div>

                <div className="relative grid gap-3 sm:grid-cols-3 md:grid-cols-5">
                  {repaymentPeriodOptions.map((period) => {
                    const selected =
                      settings.allowedRepaymentPeriods.includes(period);

                    return (
                      <button
                        key={period}
                        type="button"
                        onClick={() => toggleRepaymentPeriod(period)}
                        className={`rounded-2xl border px-4 py-4 text-sm font-extrabold transition ${
                          selected
                            ? "border-[#9b6f45]/45 bg-[#2c241f] text-[#fbf7ef] shadow-lg shadow-[#2c241f]/20"
                            : "border-[#d9c8b8] bg-[#f8f1e8]/80 text-[#6b5e54] hover:border-[#9b6f45]/45 hover:bg-[#f1e5d8] hover:text-[#2b241f]"
                        }`}
                      >
                        {period} Months
                      </button>
                    );
                  })}
                </div>

                <p className="relative mt-4 text-sm text-[#6b5e54]">
                  Selected:{" "}
                  <span className="font-extrabold text-[#9b6f45]">
                    {settings.allowedRepaymentPeriods.join(", ")} months
                  </span>
                </p>
              </CardContent>
            </Card>

            <Button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="h-14 w-full rounded-2xl bg-emerald-700 text-base font-extrabold text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 animate-spin" />
                  Saving Settings...
                </>
              ) : (
                <>
                  <Save className="mr-2" size={18} />
                  Save Loan Settings
                </>
              )}
            </Button>
          </div>

          <div className="space-y-6">
            <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#2c241f] text-[#fbf7ef] shadow-[0_30px_100px_rgba(44,36,31,0.22)] backdrop-blur-2xl">
              <CardContent className="relative p-6">
                <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#d8ad80]/25 blur-3xl" />

                <div className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d8ad80]/35 bg-[#d8ad80]/15 text-[#d8ad80]">
                  <BadgeDollarSign size={24} />
                </div>

                <p className="relative text-sm text-[#f6eadc]/75">
                  Current Interest Rate
                </p>

                <h2 className="relative mt-3 text-4xl font-extrabold">
                  {settings.interestRate}%
                </h2>

                <p className="relative mt-3 text-sm text-[#f6eadc]/70">
                  Loan EMI calculation uses this value.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
              <CardContent className="p-6">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-[#9b6f45]">
                  <WalletCards size={24} />
                </div>

                <p className="text-sm text-[#6b5e54]">Loan Amount Range</p>

                <h2 className="mt-3 text-2xl font-extrabold text-[#2b241f]">
                  LKR {settings.minimumLoanAmount.toLocaleString()} -{" "}
                  {settings.maximumLoanAmount.toLocaleString()}
                </h2>

                <p className="mt-3 text-sm text-[#79695d]">
                  Member loan requests are validated using this range.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-[32px] border border-emerald-600/25 bg-emerald-100 text-emerald-900 shadow-[0_30px_100px_rgba(44,36,31,0.14)] backdrop-blur-2xl">
              <CardContent className="p-6">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-700/20 bg-emerald-200 text-emerald-700">
                  <Gift size={24} />
                </div>

                <p className="text-sm text-emerald-800/75">
                  Funeral Support Max Amount
                </p>

                <h2 className="mt-3 text-3xl font-extrabold">
                  LKR {settings.funeralSupportMaxAmount.toLocaleString()}
                </h2>

                <p className="mt-3 text-sm text-emerald-800/65">
                  Funeral Support is non-repayable. This limit can be changed by
                  admin.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
              <CardContent className="p-6">
                <p className="text-sm text-[#6b5e54]">
                  Late Payment Penalty
                </p>

                <h2 className="mt-3 text-3xl font-extrabold text-[#2b241f]">
                  {settings.latePaymentPenaltyRate}%
                </h2>

                <p className="mt-3 text-sm text-[#79695d]">
                  Used later when overdue installments are processed.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
              <CardContent className="p-6">
                <p className="text-sm text-[#6b5e54]">Monthly Welfare Fee</p>

                <h2 className="mt-3 text-3xl font-extrabold text-[#2b241f]">
                  LKR {settings.monthlyFeeAmount.toLocaleString()}
                </h2>

                <p className="mt-3 text-sm text-[#79695d]">
                  Used later for monthly welfare fee generation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}