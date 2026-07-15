"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  EyeOff,
  IdCard,
  Loader2,
  Mail,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  UserCog,
  Users,
  WalletCards,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StaffUser {
  _id: string;
  fullName?: string;
  nic?: string;
  email?: string;
  phone?: string;
  role?: string;
  accountStatus?: string;
  department?: string;
  jobRole?: string;
  employeeId?: string;
  createdAt?: string;
}

interface StaffResponse {
  success: boolean;
  staff?: StaffUser[];
  message?: string;
}

interface CreateStaffResponse {
  success: boolean;
  message?: string;
  user?: StaffUser;
}

// Interface for StatCard Props to fix "Unexpected any" error
interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  glow: string;
  badge: string;
}

const initialForm = {
  fullName: "",
  nic: "",
  email: "",
  phone: "",
  password: "",
  role: "",
  department: "",
  jobRole: "",
};

const formatDate = (date?: string) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getRoleLabel = (role?: string) => {
  if (role === "admin") return "Admin";
  if (role === "welfare_officer") return "Welfare Officer";
  if (role === "finance_officer") return "Finance Officer";
  return role || "Staff";
};

const getRoleStyle = (role?: string) => {
  if (role === "admin") {
    return "border-[#9b6f45]/35 bg-[#f1e5d8] text-[#2b241f]";
  }

  if (role === "welfare_officer") {
    return "border-[#d8ad80]/50 bg-[#f8f1e8] text-[#9b6f45]";
  }

  if (role === "finance_officer") {
    return "border-[#d9c8b8] bg-[#f6eadc] text-[#6b5e54]";
  }

  return "border-[#d9c8b8] bg-[#fbf7ef] text-[#9b6f45]";
};

const getStatusStyle = (status?: string) => {
  if (status === "active") {
    return "border-emerald-600/25 bg-emerald-100 text-emerald-700";
  }

  if (status === "pending_admin_approval" || status === "pending") {
    return "border-[#d8ad80]/50 bg-[#f6eadc] text-[#9b6f45]";
  }

  if (status === "rejected" || status === "blocked" || status === "inactive") {
    return "border-red-500/20 bg-red-100 text-red-700";
  }

  return "border-emerald-600/25 bg-emerald-100 text-emerald-700";
};

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
  glow,
  badge,
}: StatCardProps) {
  return (
    <Card className="group cursor-pointer overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_25px_90px_rgba(44,36,31,0.16)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-[#9b6f45]/45 hover:bg-[#fffaf3]">
      <CardContent className="relative p-6">
        <div
          className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl ${glow}`}
        />

        <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-[#d8ad80]/18 blur-3xl" />

        <div className="relative flex items-start justify-between">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d9c8b8] ${iconBg} ${iconColor} shadow-lg backdrop-blur-xl`}
          >
            <Icon size={25} />
          </div>

          <span className="rounded-full border border-[#d9c8b8] bg-[#f8f1e8] px-3 py-1 text-[11px] font-bold text-[#9b6f45] backdrop-blur-xl">
            {badge}
          </span>
        </div>

        <p className="relative mt-6 text-sm font-semibold text-[#6b5e54]">
          {title}
        </p>

        <h2 className="relative mt-2 text-4xl font-extrabold tracking-tight text-[#2b241f]">
          {value}
        </h2>

        <p className="relative mt-2 text-sm text-[#79695d]">{subtitle}</p>

        <div className="relative mt-6 rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/70 p-3 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs font-semibold text-[#6b5e54]">
            <span>Current Status</span>
            <span className="text-[#9b6f45]">Live</span>
          </div>

          <div className="mt-3 h-2 rounded-full bg-[#e9dccd]">
            <div className="h-2 w-[72%] rounded-full bg-gradient-to-r from-[#2c241f] via-[#9b6f45] to-[#d8ad80]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminStaffPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [formData, setFormData] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchText, setSearchText] = useState("");

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const loadStaff = async () => {
    try {
      setLoading(true);
      setMessage("");
      setIsSuccess(false);

      const response = await fetch(`/api/admin/staff?t=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
      });

      const contentType = response.headers.get("content-type");

      if (!contentType?.includes("application/json")) {
        throw new Error("API returned HTML instead of JSON");
      }

      const result = (await response.json()) as StaffResponse;

      if (!result.success) {
        setMessage(result.message || "Failed to load staff accounts.");
        setIsSuccess(false);
        return;
      }

      setStaff(result.staff || []);
    } catch (error) {
      console.error("LOAD_STAFF_ERROR", error);
      setMessage("Failed to load staff accounts.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStaff();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const handleCreateStaff = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setCreating(true);
      setMessage("");
      setIsSuccess(false);

      const response = await fetch("/api/admin/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const contentType = response.headers.get("content-type");

      if (!contentType?.includes("application/json")) {
        throw new Error("API returned HTML instead of JSON");
      }

      const result = (await response.json()) as CreateStaffResponse;

      if (!result.success) {
        setMessage(result.message || "Failed to create staff account.");
        setIsSuccess(false);
        return;
      }

      if (result.user) {
        setStaff((prev) => [result.user as StaffUser, ...prev]);
      }

      setFormData(initialForm);
      setShowPassword(false);
      setMessage(result.message || "Staff account created successfully.");
      setIsSuccess(true);

      router.refresh();
    } catch (error) {
      console.error("CREATE_STAFF_UI_ERROR", error);
      setMessage("Failed to create staff account.");
      setIsSuccess(false);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteStaff = async (staffId: string, fullName?: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${fullName || "this staff account"}?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(staffId);
      setMessage("");

      const response = await fetch(`/api/admin/staff?id=${staffId}`, {
        method: "DELETE",
        cache: "no-store",
      });

      const result = await response.json();

      if (!result.success) {
        setMessage(result.message || "Failed to delete staff account.");
        setIsSuccess(false);
        return;
      }

      setStaff((prev) => prev.filter((user) => String(user._id) !== String(staffId)));

      setMessage(result.message || "Staff account deleted successfully.");
      setIsSuccess(true);

      router.refresh();
    } catch (error) {
      console.error("DELETE_STAFF_UI_ERROR", error);
      setMessage("Failed to delete staff account.");
      setIsSuccess(false);
    } finally {
      setDeletingId("");
    }
  };

  const filteredStaff = useMemo(() => {
    const keyword = searchText.toLowerCase().trim();

    if (!keyword) return staff;

    return staff.filter((user) => {
      return (
        user.fullName?.toLowerCase().includes(keyword) ||
        user.nic?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword) ||
        user.phone?.toLowerCase().includes(keyword) ||
        user.role?.toLowerCase().includes(keyword) ||
        user.department?.toLowerCase().includes(keyword) ||
        user.jobRole?.toLowerCase().includes(keyword) ||
        user.employeeId?.toLowerCase().includes(keyword)
      );
    });
  }, [staff, searchText]);

  const totalStaff = staff.length;
  const admins = staff.filter((user) => user.role === "admin").length;
  const welfareOfficers = staff.filter(
    (user) => user.role === "welfare_officer"
  ).length;
  const financeOfficers = staff.filter(
    (user) => user.role === "finance_officer"
  ).length;

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#eee6da] text-[#2b241f]">
        <Loader2 className="mr-2 animate-spin text-[#9b6f45]" />
        Loading staff accounts...
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
                Welfare
              </p>

              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#2b241f] md:text-5xl">
                Staff Management
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b5e54]">
                Create and manage internal staff accounts such as Welfare
                Officers, Finance Officers and Admin users.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => void loadStaff()}
                className="rounded-2xl border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] backdrop-blur-xl transition hover:border-[#9b6f45]/45 hover:bg-[#f1e5d8]"
              >
                Refresh
              </Button>

              <Button className="rounded-2xl bg-[#2c241f] px-5 text-[#fbf7ef] shadow-lg shadow-[#2c241f]/20 transition hover:bg-[#9b6f45]">
                <UserCog className="mr-2" size={17} />
                {totalStaff} Staff
              </Button>
            </div>
          </div>
        </section>

        <section className="relative grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Staff"
            value={totalStaff}
            subtitle="All internal staff accounts"
            icon={Users}
            iconColor="text-[#9b6f45]"
            iconBg="bg-[#f1e5d8]"
            glow="bg-[#d8ad80]/30"
            badge="Staff"
          />

          <StatCard
            title="Admins"
            value={admins}
            subtitle="System administration users"
            icon={ShieldCheck}
            iconColor="text-[#2b241f]"
            iconBg="bg-[#f1e5d8]"
            glow="bg-[#2c241f]/10"
            badge="Admin"
          />

          <StatCard
            title="Welfare Officers"
            value={welfareOfficers}
            subtitle="Loan and grant review officers"
            icon={CheckCircle2}
            iconColor="text-emerald-700"
            iconBg="bg-emerald-100"
            glow="bg-emerald-400/20"
            badge="Officer"
          />

          <StatCard
            title="Finance Officers"
            value={financeOfficers}
            subtitle="Payment and disbursement officers"
            icon={WalletCards}
            iconColor="text-[#9b6f45]"
            iconBg="bg-[#f6eadc]"
            glow="bg-[#d8ad80]/25"
            badge="Finance"
          />
        </section>

        <section className="relative grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="relative p-6">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#d8ad80]/20 blur-3xl" />

              <div className="relative mb-6">
                <h2 className="text-2xl font-extrabold text-[#2b241f]">
                  Add Staff Account
                </h2>
                <p className="mt-1 text-sm text-[#6b5e54]">
                  Create officer accounts directly from admin dashboard.
                </p>
              </div>

              <form onSubmit={handleCreateStaff} className="relative space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-[#6b5e54]">
                    Full Name
                  </Label>

                  <div className="relative mt-2">
                    <UserCog
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#9b6f45]"
                    />

                    <Input
                      value={formData.fullName}
                      onChange={(event) =>
                        updateField("fullName", event.target.value)
                      }
                      placeholder="Enter staff full name"
                      className="h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/80 pl-11 text-sm text-[#2b241f] placeholder:text-[#9b6f45]/55 focus-visible:ring-[#9b6f45]/30"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-[#6b5e54]">
                    NIC Number
                  </Label>

                  <div className="relative mt-2">
                    <IdCard
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#9b6f45]"
                    />

                    <Input
                      value={formData.nic}
                      onChange={(event) => updateField("nic", event.target.value)}
                      placeholder="Enter NIC number"
                      className="h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/80 pl-11 text-sm text-[#2b241f] placeholder:text-[#9b6f45]/55 focus-visible:ring-[#9b6f45]/30"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-semibold text-[#6b5e54]">
                      Email
                    </Label>

                    <div className="relative mt-2">
                      <Mail
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#9b6f45]"
                      />

                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(event) =>
                          updateField("email", event.target.value)
                        }
                        placeholder="staff@email.com"
                        className="h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/80 pl-11 text-sm text-[#2b241f] placeholder:text-[#9b6f45]/55 focus-visible:ring-[#9b6f45]/30"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-[#6b5e54]">
                      Phone
                    </Label>

                    <div className="relative mt-2">
                      <Phone
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#9b6f45]"
                      />

                      <Input
                        value={formData.phone}
                        onChange={(event) =>
                          updateField("phone", event.target.value)
                        }
                        placeholder="0712345678"
                        className="h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/80 pl-11 text-sm text-[#2b241f] placeholder:text-[#9b6f45]/55 focus-visible:ring-[#9b6f45]/30"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-[#6b5e54]">
                    Password
                  </Label>

                  <div className="relative mt-2">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(event) =>
                        updateField("password", event.target.value)
                      }
                      placeholder="Create temporary password"
                      className="h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/80 pr-14 text-sm text-[#2b241f] placeholder:text-[#9b6f45]/55 focus-visible:ring-[#9b6f45]/30"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl border border-[#d9c8b8] bg-[#fbf7ef] text-[#9b6f45] transition hover:bg-[#f1e5d8]"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-[#6b5e54]">
                    Staff Role
                  </Label>

                  <Select
                    value={formData.role}
                    onValueChange={(value) => updateField("role", value)}
                  >
                    <SelectTrigger className="mt-2 h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/80 text-[#2b241f] focus:ring-[#9b6f45]/30">
                      <SelectValue placeholder="Select staff role" />
                    </SelectTrigger>

                    <SelectContent className="border-[#d9c8b8] bg-[#fbf7ef] text-[#2b241f]">
                      <SelectItem value="welfare_officer">
                        Welfare Officer
                      </SelectItem>
                      <SelectItem value="finance_officer">
                        Finance Officer
                      </SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-semibold text-[#6b5e54]">
                      Department
                    </Label>

                    <div className="relative mt-2">
                      <BriefcaseBusiness
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#9b6f45]"
                      />

                      <Input
                        value={formData.department}
                        onChange={(event) =>
                          updateField("department", event.target.value)
                        }
                        placeholder="Department"
                        className="h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/80 pl-11 text-sm text-[#2b241f] placeholder:text-[#9b6f45]/55 focus-visible:ring-[#9b6f45]/30"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-[#6b5e54]">
                      Employee ID
                    </Label>

                    <div className="mt-2 flex h-12 items-center rounded-2xl border border-[#d9c8b8] bg-[#f6eadc] px-4 text-sm font-semibold text-[#9b6f45]">
                      Auto Generated by System
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-[#6b5e54]">
                    Job Role
                  </Label>

                  <Input
                    value={formData.jobRole}
                    onChange={(event) => updateField("jobRole", event.target.value)}
                    placeholder="Example: Welfare Officer"
                    className="mt-2 h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/80 text-sm text-[#2b241f] placeholder:text-[#9b6f45]/55 focus-visible:ring-[#9b6f45]/30"
                  />
                </div>

                {message && (
                  <div
                    className={`rounded-2xl border p-3 text-sm font-semibold ${
                      isSuccess
                        ? "border-emerald-600/25 bg-emerald-100 text-emerald-700"
                        : "border-red-500/20 bg-red-100 text-red-700"
                    }`}
                  >
                    {message}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={creating}
                  className="h-[52px] w-full rounded-2xl bg-[#2c241f] text-sm font-extrabold text-[#fbf7ef] shadow-lg shadow-[#2c241f]/20 transition hover:bg-[#9b6f45] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" />
                      Creating Staff...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2" size={18} />
                      Create Staff Account
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="relative p-6">
              <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#d8ad80]/20 blur-3xl" />
              <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-[#2c241f]/10 blur-3xl" />

              <div className="relative mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#2b241f]">
                    Staff Accounts
                  </h2>
                  <p className="mt-1 text-sm text-[#6b5e54]">
                    Active internal users created by admin.
                  </p>
                </div>

                <div className="relative w-full lg:w-[340px]">
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9b6f45]"
                  />

                  <Input
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Search staff..."
                    className="h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/80 pl-11 text-[#2b241f] placeholder:text-[#9b6f45]/55 focus-visible:ring-[#9b6f45]/30"
                  />
                </div>
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/70">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1220px] table-fixed border-collapse text-left text-sm">
                    <thead className="bg-[#efe2d2] text-xs uppercase tracking-wide text-[#6b5e54]">
                      <tr>
                        <th className="w-[220px] px-5 py-4 align-middle font-extrabold">
                          Staff
                        </th>
                        <th className="w-[140px] px-5 py-4 align-middle font-extrabold">
                          NIC
                        </th>
                        <th className="w-[230px] px-5 py-4 align-middle font-extrabold">
                          Contact
                        </th>
                        <th className="w-[165px] px-5 py-4 text-center align-middle font-extrabold">
                          Role
                        </th>
                        <th className="w-[160px] px-5 py-4 align-middle font-extrabold">
                          Department
                        </th>
                        <th className="w-[140px] px-5 py-4 text-center align-middle font-extrabold">
                          Employee ID
                        </th>
                        <th className="w-[130px] px-5 py-4 text-center align-middle font-extrabold">
                          Status
                        </th>
                        <th className="w-[130px] px-5 py-4 text-center align-middle font-extrabold">
                          Created
                        </th>
                        <th className="w-[150px] px-5 py-4 text-center align-middle font-extrabold">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#d9c8b8]">
                      {filteredStaff.length === 0 ? (
                        <tr>
                          <td
                            colSpan={9}
                            className="px-5 py-10 text-center text-[#6b5e54]"
                          >
                            No staff accounts found.
                          </td>
                        </tr>
                      ) : (
                        filteredStaff.map((user) => (
                          <tr
                            key={user._id}
                            className="bg-[#fbf7ef]/60 transition-all duration-300 hover:bg-[#fffaf3] hover:shadow-[inset_4px_0_0_rgba(155,111,69,0.75)]"
                          >
                            <td className="px-5 py-4 align-middle">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-sm font-extrabold text-[#9b6f45] shadow-lg shadow-[#2c241f]/10">
                                  {user.fullName?.charAt(0)?.toUpperCase() || "S"}
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate font-bold text-[#2b241f]">
                                    {user.fullName || "Unnamed Staff"}
                                  </p>
                                  <p className="mt-1 truncate text-xs text-[#79695d]">
                                    {user.jobRole || getRoleLabel(user.role)}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4 align-middle text-[#6b5e54]">
                              <p className="truncate">{user.nic || "N/A"}</p>
                            </td>

                            <td className="px-5 py-4 align-middle">
                              <div className="min-w-0">
                                <p className="truncate text-[#6b5e54]">
                                  {user.email || "N/A"}
                                </p>
                                <p className="mt-1 truncate text-xs font-semibold text-[#9b6f45]">
                                  {user.phone || "N/A"}
                                </p>
                              </div>
                            </td>

                            <td className="px-5 py-4 text-center align-middle">
                              <span
                                className={`inline-flex min-w-[130px] items-center justify-center rounded-full border px-3 py-1.5 text-xs font-extrabold ${getRoleStyle(
                                  user.role
                                )}`}
                              >
                                {getRoleLabel(user.role)}
                              </span>
                            </td>

                            <td className="px-5 py-4 align-middle text-[#6b5e54]">
                              <p className="truncate">{user.department || "N/A"}</p>
                            </td>

                            <td className="px-5 py-4 text-center align-middle text-[#6b5e54]">
                              <span className="whitespace-nowrap">
                                {user.employeeId || "N/A"}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-center align-middle">
                              <span
                                className={`inline-flex min-w-[105px] items-center justify-center rounded-full border px-3 py-1.5 text-xs font-extrabold capitalize ${getStatusStyle(
                                  user.accountStatus
                                )}`}
                              >
                                {user.accountStatus || "active"}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-center align-middle text-[#79695d]">
                              <span className="whitespace-nowrap">
                                {formatDate(user.createdAt)}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-center align-middle">
                              <Button
                                type="button"
                                onClick={() => handleDeleteStaff(user._id, user.fullName)}
                                disabled={deletingId === user._id}
                                className="rounded-2xl bg-red-600 px-4 font-extrabold text-white shadow-lg shadow-red-600/20 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {deletingId === user._id ? (
                                  <Loader2 size={16} className="mr-2 animate-spin" />
                                ) : (
                                  <Trash2 size={16} className="mr-2" />
                                )}
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="relative mt-4 flex flex-col justify-between gap-3 text-sm text-[#6b5e54] md:flex-row">
                <p>
                  Showing{" "}
                  <span className="font-bold text-[#9b6f45]">
                    {filteredStaff.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-[#9b6f45]">{totalStaff}</span>{" "}
                  staff accounts
                </p>

                <p>Created staff can login using the normal login page.</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}