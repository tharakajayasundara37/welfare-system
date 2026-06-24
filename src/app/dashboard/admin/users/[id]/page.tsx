import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  IdCard,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";

import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

type PageProps = {
  params: Promise<{ id: string }>;
};

function value(data?: string | boolean | Date | null) {
  if (data === undefined || data === null || data === "") return "N/A";
  if (typeof data === "boolean") return data ? "Yes" : "No";
  if (data instanceof Date) {
    return data.toLocaleDateString("en-LK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return String(data).replaceAll("_", " ");
}

function initials(name?: string, email?: string) {
  const text = name || email || "User";
  return text
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function InfoCard({
  label,
  text,
  icon: Icon,
}: {
  label: string;
  text?: string | boolean | Date | null;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-[26px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-5 shadow-[0_18px_55px_rgba(44,36,31,0.10)]">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-[#9b6f45]">
          <Icon size={19} />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9b6f45]">
            {label}
          </p>
          <p className="mt-1 font-extrabold capitalize text-[#2b241f]">
            {value(text)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id } = await params;

  await dbConnect();

  const user = await User.findById(id).select("-password").lean();

  if (!user) {
    notFound();
  }

  const userData = {
    _id: user._id.toString(),
    fullName: user.fullName || "",
    email: user.email || "",
    phone: user.phone || "",
    nic: user.nic || "",
    employeeId: user.employeeId || "",
    companyName: user.companyName || "",
    department: user.department || "",
    jobRole: user.jobRole || "",
    salaryRange: user.salaryRange || "",
    role: user.role || "",
    accountStatus: user.accountStatus || "",
    isVerified: Boolean(user.isVerified),
    createdAt: user.createdAt as Date,
    updatedAt: user.updatedAt as Date,
  };

  return (
    <div className="min-h-screen rounded-[34px] bg-[#eee6da] p-6 text-[#2b241f]">
      <section className="overflow-hidden rounded-[34px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-7 shadow-[0_30px_100px_rgba(44,36,31,0.16)]">
        <Link
          href="/dashboard/admin/users"
          className="inline-flex items-center gap-2 rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8] px-4 py-2 text-sm font-bold text-[#9b6f45] transition hover:bg-[#fffaf3]"
        >
          <ArrowLeft size={16} />
          Back to Members
        </Link>

        <div className="mt-7 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-[#9b6f45]">
              Member Profile
            </p>

            <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
              {value(userData.fullName)}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b5e54]">
              Complete user account details, employment information and account
              status.
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-[28px] border border-[#d9c8b8] bg-[#fffaf3] p-4 shadow-lg">
            <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#d8ad80] to-[#9b6f45] text-2xl font-extrabold text-white">
              {initials(userData.fullName, userData.email)}
            </div>

            <div>
              <p className="text-lg font-extrabold">{userData.fullName}</p>
              <p className="text-sm font-bold capitalize text-[#9b6f45]">
                {value(userData.role)}
              </p>
              <p className="mt-1 text-xs text-[#6b5e54]">{userData.email}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="Email" text={userData.email} icon={Mail} />
        <InfoCard label="Phone" text={userData.phone} icon={Phone} />
        <InfoCard label="NIC" text={userData.nic} icon={IdCard} />
        <InfoCard
          label="Status"
          text={userData.accountStatus}
          icon={ShieldCheck}
        />
      </section>

      <section className="mt-6 rounded-[34px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-6 shadow-[0_30px_100px_rgba(44,36,31,0.12)]">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1e5d8] text-[#9b6f45]">
            <UserRound size={22} />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold">Account Details</h2>
            <p className="text-sm text-[#6b5e54]">
              Personal, role and verification information.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <InfoCard label="Employee ID" text={userData.employeeId} icon={BadgeCheck} />
          <InfoCard label="Company" text={userData.companyName} icon={Building2} />
          <InfoCard label="Department" text={userData.department} icon={Building2} />
          <InfoCard label="Job Role" text={userData.jobRole} icon={UserRound} />
          <InfoCard label="Salary Range" text={userData.salaryRange} icon={Wallet} />
          <InfoCard label="Verified" text={userData.isVerified} icon={ShieldCheck} />
          <InfoCard label="Joined" text={userData.createdAt} icon={CalendarDays} />
          <InfoCard label="Last Updated" text={userData.updatedAt} icon={CalendarDays} />
        </div>
      </section>
    </div>
  );
}