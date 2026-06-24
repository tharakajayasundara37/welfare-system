import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  IdCard,
  Mail,
  Phone,
  Settings,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";

import { getCurrentUser } from "@/lib/getCurrentUser";

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

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen rounded-[34px] bg-[#eee6da] p-6 text-[#2b241f]">
        <div className="rounded-[32px] border border-red-500/20 bg-red-100 p-6 text-red-700">
          Unauthorized. Please login first.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen rounded-[34px] bg-[#eee6da] p-6 text-[#2b241f]">
      <section className="overflow-hidden rounded-[34px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-7 shadow-[0_30px_100px_rgba(44,36,31,0.16)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8] px-4 py-2 text-sm font-bold text-[#9b6f45] transition hover:bg-[#fffaf3]"
          >
            <ArrowLeft size={16} />
            Back
          </Link>

          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#9b6f45] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[#9b6f45]/25 transition hover:bg-[#835c38]"
          >
            <Settings size={16} />
            Edit Profile
          </Link>
        </div>

        <div className="mt-7 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-[#9b6f45]">
              My Profile
            </p>

            <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
              {value(user.fullName)}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b5e54]">
              View your personal, employment and account information.
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-[28px] border border-[#d9c8b8] bg-[#fffaf3] p-4 shadow-lg">
            {user.profileImage ? (
              <div className="relative h-24 w-24 overflow-hidden rounded-[26px] border border-[#d8ad80]/45 bg-[#f1e5d8]">
                <Image
                  src={user.profileImage}
                  alt="Profile"
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-[26px] bg-gradient-to-br from-[#d8ad80] to-[#9b6f45] text-3xl font-extrabold text-white">
                {initials(user.fullName, user.email)}
              </div>
            )}

            <div>
              <p className="text-xl font-extrabold">{user.fullName}</p>
              <p className="text-sm font-bold capitalize text-[#9b6f45]">
                {value(user.role)}
              </p>
              <p className="mt-1 text-xs text-[#6b5e54]">{user.email}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="Email" text={user.email} icon={Mail} />
        <InfoCard label="Phone" text={user.phone} icon={Phone} />
        <InfoCard label="NIC" text={user.nic} icon={IdCard} />
        <InfoCard label="Status" text={user.accountStatus} icon={ShieldCheck} />
      </section>

      <section className="mt-6 rounded-[34px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-6 shadow-[0_30px_100px_rgba(44,36,31,0.12)]">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1e5d8] text-[#9b6f45]">
            <UserRound size={22} />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold">Account Details</h2>
            <p className="text-sm text-[#6b5e54]">
              Your profile details are managed from Account Settings.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <InfoCard label="Employee ID" text={user.employeeId} icon={BadgeCheck} />
          <InfoCard label="Company" text={user.companyName} icon={Building2} />
          <InfoCard label="Department" text={user.department} icon={Building2} />
          <InfoCard label="Job Role" text={user.jobRole} icon={UserRound} />
          <InfoCard label="Salary Range" text={user.salaryRange} icon={Wallet} />
          <InfoCard label="Verified" text={user.isVerified} icon={ShieldCheck} />
          <InfoCard label="Joined" text={user.createdAt as Date} icon={CalendarDays} />
          <InfoCard
            label="Last Updated"
            text={user.updatedAt as Date}
            icon={CalendarDays}
          />
        </div>
      </section>
    </div>
  );
}