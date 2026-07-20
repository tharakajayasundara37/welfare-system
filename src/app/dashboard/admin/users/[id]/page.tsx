import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  Users,
  XCircle,
  Eye,
} from "lucide-react";

import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

// --- Helper Functions ---
function getStatusBadgeClass(status?: string) {
  const normalized = String(status || "").toLowerCase();
  
  if (normalized === "active" || normalized.includes("approved")) {
    return "border-emerald-600/25 bg-emerald-100 text-emerald-700";
  }
  if (normalized === "pending" || normalized.includes("review")) {
    return "border-[#d8ad80]/50 bg-[#f6eadc] text-[#9b6f45]";
  }
  if (normalized === "inactive" || normalized.includes("reject") || normalized.includes("blocked")) {
    return "border-red-500/20 bg-red-100 text-red-700";
  }
  
  return "border-[#d9c8b8] bg-[#fbf7ef] text-[#9b6f45]";
}

function formatDate(date?: Date | null) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// --- Updated StatCard Component ---
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  glow,
  badge,
  iconColor,
  iconBg,
  progress = 72,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  glow: string;
  badge: string;
  iconColor: string;
  iconBg: string;
  progress?: number;
}) {
  return (
    <div className="group relative h-full overflow-hidden rounded-[30px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-5 text-[#2b241f] shadow-[0_25px_90px_rgba(44,36,31,0.14)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-[#9b6f45]/45 hover:bg-[#fffaf3]">
      <div
        className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl ${glow}`}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#d9c8b8] ${iconBg} ${iconColor} shadow-lg backdrop-blur-xl`}
        >
          <Icon size={22} />
        </div>

        <span className="rounded-full border border-[#d9c8b8] bg-[#f8f1e8] px-3 py-1 text-[11px] font-bold text-[#9b6f45]">
          {badge}
        </span>
      </div>

      {/* Text Details Centered & Highlighted */}
      <div className="relative mt-6 flex flex-col items-center text-center">
        <p className="text-sm font-semibold text-[#6b5e54]">{title}</p>
        <h2 className="mt-3 break-words text-5xl font-black tracking-tight text-[#2b241f] drop-shadow-sm">
          {value}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#79695d]">{subtitle}</p>
      </div>

      <div className="relative mt-auto pt-6">
        <div className="flex items-center justify-between text-xs font-semibold text-[#6b5e54]">
          <span>Current Status</span>
          <span className="text-[#9b6f45]">Live</span>
        </div>

        <div className="mt-3 h-2 rounded-full bg-[#e9dccd]">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-[#2c241f] via-[#9b6f45] to-[#d8ad80]"
            style={{ width: `${Math.min(Math.max(progress, 6), 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// --- Main Page Component ---
export default async function AdminUsersPage() {
  await dbConnect();

  // Database එකෙන් Users ලා ඔක්කොම ගන්නවා
  const users = await User.find().sort({ createdAt: -1 }).lean();

  // Stats ගණනය කිරීම
  const totalMembers = users.length;
  const activeMembers = users.filter((u) => u.accountStatus === "active").length;
  const pendingMembers = users.filter((u) => u.accountStatus === "pending").length;
  const inactiveMembers = users.filter(
    (u) => u.accountStatus === "inactive" || u.accountStatus === "rejected" || u.accountStatus === "blocked"
  ).length;

  return (
    <div className="min-h-screen overflow-hidden rounded-[34px] bg-[#eee6da] text-[#2b241f] p-6">
      
      <section className="relative overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-7 shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl mb-6">
        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-[#9b6f45]">
              Administration
            </p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#2b241f] md:text-5xl">
              User Management
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b5e54]">
              Manage all registered welfare members, approve pending accounts, and monitor user statuses.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Cards Section */}
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard
          title="Total Members"
          value={totalMembers}
          subtitle="All registered welfare users"
          icon={Users}
          glow="bg-[#d8ad80]/30"
          badge="Members"
          iconColor="text-[#8a5f3c]"
          iconBg="bg-[#f1e5d8]"
          progress={100}
        />
        <StatCard
          title="Active Members"
          value={activeMembers}
          subtitle="Approved active accounts"
          icon={CheckCircle2}
          glow="bg-emerald-500/18"
          badge="Active"
          iconColor="text-emerald-700"
          iconBg="bg-emerald-500/10"
          progress={totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0}
        />
        <StatCard
          title="Pending Members"
          value={pendingMembers}
          subtitle="Waiting for admin approval"
          icon={Clock3}
          glow="bg-orange-500/18"
          badge="Pending"
          iconColor="text-orange-700"
          iconBg="bg-orange-500/10"
          progress={totalMembers > 0 ? (pendingMembers / totalMembers) * 100 : 0}
        />
        <StatCard
          title="Inactive Members"
          value={inactiveMembers}
          subtitle="Blocked or rejected accounts"
          icon={XCircle}
          glow="bg-red-500/16"
          badge="Inactive"
          iconColor="text-red-700"
          iconBg="bg-red-500/10"
          progress={totalMembers > 0 ? (inactiveMembers / totalMembers) * 100 : 0}
        />
      </section>

      {/* Table Section */}
      <section className="relative overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
        <div className="p-6 border-b border-[#d9c8b8] flex justify-between items-center">
          <h2 className="text-xl font-extrabold text-[#2b241f]">Member Directory</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] table-fixed text-left text-sm">
            <colgroup>
              <col className="w-[250px]" />
              <col className="w-[180px]" />
              <col className="w-[150px]" />
              <col className="w-[150px]" />
              <col className="w-[120px]" />
            </colgroup>
            <thead className="bg-[#efe2d2] text-xs uppercase tracking-wide text-[#6b5e54]">
              <tr>
                <th className="px-5 py-4 font-extrabold">Member Details</th>
                <th className="px-5 py-4 font-extrabold text-center">Contact</th>
                <th className="px-5 py-4 font-extrabold text-center">Employee ID</th>
                <th className="px-5 py-4 font-extrabold text-center">Status</th>
                <th className="px-5 py-4 font-extrabold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d9c8b8]">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-[#6b5e54]">
                    No members found in the system.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id.toString()} className="bg-[#fbf7ef]/60 transition hover:bg-[#fffaf3]">
                    <td className="px-5 py-4 align-middle">
                      <p className="truncate font-bold text-[#2b241f]">{user.fullName || "N/A"}</p>
                      <p className="mt-1 text-xs text-[#79695d]">Joined {formatDate(user.createdAt)}</p>
                    </td>
                    <td className="px-5 py-4 align-middle text-center">
                      <p className="truncate text-[#6b5e54] font-medium">{user.phone || "N/A"}</p>
                    </td>
                    <td className="px-5 py-4 align-middle text-center text-[#6b5e54] font-medium">
                      {user.employeeId || "N/A"}
                    </td>
                    <td className="px-5 py-4 align-middle text-center">
                      <span className={`inline-flex justify-center min-w-[90px] rounded-full border px-3 py-1.5 text-xs font-extrabold capitalize ${getStatusBadgeClass(user.accountStatus)}`}>
                        {user.accountStatus || "Unknown"}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-middle text-center">
                      {/* Action Button -> Goes to User Details Page */}
                      <Link href={`/dashboard/admin/users/${user._id.toString()}`}>
                        <button className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#f1e5d8] text-[#9b6f45] transition-colors hover:bg-[#9b6f45] hover:text-white">
                          <Eye size={18} />
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      
    </div>
  );
}