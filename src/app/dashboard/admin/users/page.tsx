"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  Search,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Member {
  _id: string;
  fullName?: string;
  email?: string;
  phone?: string;
  nic?: string;
  role?: string;
  accountStatus?: string;
  companyName?: string;
  department?: string;
  jobRole?: string;
  employeeId?: string;
  salaryRange?: string;
  createdAt?: string;
}

interface UsersResponse {
  success: boolean;
  users?: Member[];
  message?: string;
}

interface ActionResponse {
  success: boolean;
  message?: string;
  user?: Member;
}

const formatDate = (date?: string) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

  return "border-[#d9c8b8] bg-[#f8f1e8] text-[#6b5e54]";
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

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
  glow,
  badge,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  glow: string;
  badge: string;
}) {
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

export default function AdminUsersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchText, setSearchText] = useState("");

  const loadMembers = async () => {
    try {
      setLoading(true);
      setMessage("");
      setIsSuccess(false);

      const response = await fetch("/api/admin/users", {
        method: "GET",
        cache: "no-store",
      });

      const contentType = response.headers.get("content-type");

      if (!contentType?.includes("application/json")) {
        throw new Error("API returned HTML instead of JSON");
      }

      const result = (await response.json()) as UsersResponse;

      if (!result.success) {
        setMessage(result.message || "Failed to load members");
        setIsSuccess(false);
        return;
      }

      setMembers(result.users || []);
    } catch (error) {
      console.error("LOAD_MEMBERS_ERROR", error);
      setMessage("Failed to load members");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMembers();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const handleUserAction = async (
    userId: string,
    action: "approve" | "reject"
  ) => {
    try {
      setActionLoadingId(`${action}-${userId}`);
      setMessage("");
      setIsSuccess(false);

      const response = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: "PATCH",
      });

      const contentType = response.headers.get("content-type");

      if (!contentType?.includes("application/json")) {
        throw new Error("API returned HTML instead of JSON");
      }

      const result = (await response.json()) as ActionResponse;

      if (!result.success) {
        setMessage(result.message || `Failed to ${action} user`);
        setIsSuccess(false);
        return;
      }

      setMembers((prevMembers) =>
        prevMembers.map((member) =>
          member._id === userId
            ? {
                ...member,
                accountStatus: action === "approve" ? "active" : "rejected",
              }
            : member
        )
      );

      setMessage(
        action === "approve"
          ? "User approved successfully"
          : "User rejected successfully"
      );
      setIsSuccess(true);
    } catch (error) {
      console.error("USER_ACTION_ERROR", error);
      setMessage(`Failed to ${action} user`);
      setIsSuccess(false);
    } finally {
      setActionLoadingId("");
    }
  };

  const filteredMembers = useMemo(() => {
    const keyword = searchText.toLowerCase().trim();

    if (!keyword) return members;

    return members.filter((member) => {
      return (
        member.fullName?.toLowerCase().includes(keyword) ||
        member.email?.toLowerCase().includes(keyword) ||
        member.phone?.toLowerCase().includes(keyword) ||
        member.nic?.toLowerCase().includes(keyword) ||
        member.employeeId?.toLowerCase().includes(keyword) ||
        member.department?.toLowerCase().includes(keyword) ||
        member.jobRole?.toLowerCase().includes(keyword) ||
        member.role?.toLowerCase().includes(keyword) ||
        member.accountStatus?.toLowerCase().includes(keyword)
      );
    });
  }, [members, searchText]);

  const totalMembers = members.length;

  const activeMembers = members.filter(
    (member) => member.accountStatus === "active"
  ).length;

  const pendingMembers = members.filter(
    (member) =>
      member.accountStatus === "pending_admin_approval" ||
      member.accountStatus === "pending"
  ).length;

  const inactiveMembers = members.filter(
    (member) =>
      member.accountStatus === "inactive" ||
      member.accountStatus === "blocked" ||
      member.accountStatus === "rejected"
  ).length;

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#eee6da] text-[#2b241f]">
        <Loader2 className="mr-2 animate-spin text-[#9b6f45]" />
        Loading members...
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
                Member Management
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b5e54]">
                View all registered members, account status, roles, departments
                and employee details in one admin control table.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => void loadMembers()}
                className="rounded-2xl border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] backdrop-blur-xl transition hover:border-[#9b6f45]/45 hover:bg-[#f1e5d8]"
              >
                Refresh
              </Button>

              <Button className="rounded-2xl bg-[#2c241f] px-5 text-[#fbf7ef] shadow-lg shadow-[#2c241f]/20 transition hover:bg-[#9b6f45]">
                <UserCheck className="mr-2" size={17} />
                {totalMembers} Members
              </Button>
            </div>
          </div>
        </section>

        <section className="relative grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Members"
            value={totalMembers}
            subtitle="All registered welfare users"
            icon={Users}
            iconColor="text-[#9b6f45]"
            iconBg="bg-[#f1e5d8]"
            glow="bg-[#d8ad80]/30"
            badge="Members"
          />

          <StatCard
            title="Active Members"
            value={activeMembers}
            subtitle="Approved active accounts"
            icon={CheckCircle2}
            iconColor="text-emerald-700"
            iconBg="bg-emerald-100"
            glow="bg-emerald-400/20"
            badge="Active"
          />

          <StatCard
            title="Pending Members"
            value={pendingMembers}
            subtitle="Waiting for admin approval"
            icon={Clock3}
            iconColor="text-[#9b6f45]"
            iconBg="bg-[#f6eadc]"
            glow="bg-[#d8ad80]/25"
            badge="Pending"
          />

          <StatCard
            title="Inactive Members"
            value={inactiveMembers}
            subtitle="Blocked or rejected accounts"
            icon={XCircle}
            iconColor="text-red-700"
            iconBg="bg-red-100"
            glow="bg-red-400/15"
            badge="Inactive"
          />
        </section>

        <section className="relative">
          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="relative p-6">
              <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#d8ad80]/20 blur-3xl" />
              <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-[#2c241f]/10 blur-3xl" />

              <div className="relative mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#2b241f]">
                    Members List
                  </h2>

                  <p className="mt-1 text-sm text-[#6b5e54]">
                    All registered members and staff accounts.
                  </p>
                </div>

                <div className="relative w-full lg:w-[380px]">
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9b6f45]"
                  />

                  <Input
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Search members..."
                    className="h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/80 pl-11 text-[#2b241f] placeholder:text-[#9b6f45]/55 focus-visible:ring-[#9b6f45]/30"
                  />
                </div>
              </div>

              {message && (
                <div
                  className={`relative mb-5 rounded-2xl border p-4 text-sm font-semibold ${
                    isSuccess
                      ? "border-emerald-600/25 bg-emerald-100 text-emerald-700"
                      : "border-red-500/20 bg-red-100 text-red-700"
                  }`}
                >
                  {message}
                </div>
              )}

              <div className="relative overflow-hidden rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/70">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1280px] table-fixed border-collapse text-left text-sm">
                    <thead className="bg-[#efe2d2] text-xs uppercase tracking-wide text-[#6b5e54]">
                      <tr>
                        <th className="w-[230px] px-5 py-4 align-middle font-extrabold">
                          Member
                        </th>
                        <th className="w-[230px] px-5 py-4 align-middle font-extrabold">
                          Contact
                        </th>
                        <th className="w-[140px] px-5 py-4 align-middle font-extrabold">
                          NIC
                        </th>
                        <th className="w-[140px] px-5 py-4 align-middle font-extrabold">
                          Employee ID
                        </th>
                        <th className="w-[170px] px-5 py-4 align-middle font-extrabold">
                          Department
                        </th>
                        <th className="w-[160px] px-5 py-4 align-middle font-extrabold">
                          Job Role
                        </th>
                        <th className="w-[130px] px-5 py-4 align-middle font-extrabold">
                          Salary
                        </th>
                        <th className="w-[150px] px-5 py-4 text-center align-middle font-extrabold">
                          Role
                        </th>
                        <th className="w-[190px] px-5 py-4 text-center align-middle font-extrabold">
                          Status
                        </th>
                        <th className="w-[140px] px-5 py-4 text-center align-middle font-extrabold">
                          Joined
                        </th>
                        <th className="w-[230px] px-5 py-4 text-center align-middle font-extrabold">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#d9c8b8]">
                      {filteredMembers.length === 0 ? (
                        <tr>
                          <td
                            colSpan={11}
                            className="px-5 py-10 text-center text-[#6b5e54]"
                          >
                            No members found.
                          </td>
                        </tr>
                      ) : (
                        filteredMembers.map((member) => (
                          <tr
                            key={member._id}
                            className="cursor-pointer bg-[#fbf7ef]/60 transition-all duration-300 hover:bg-[#fffaf3] hover:shadow-[inset_4px_0_0_rgba(155,111,69,0.75)]"
                          >
                            <td className="px-5 py-4 align-middle">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-sm font-extrabold text-[#9b6f45] shadow-lg shadow-[#2c241f]/10">
                                  {member.fullName?.charAt(0)?.toUpperCase() ||
                                    "U"}
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate font-bold text-[#2b241f]">
                                    {member.fullName || "Unnamed Member"}
                                  </p>

                                  <p className="mt-1 truncate text-xs text-[#79695d]">
                                    {member.companyName || "Welfare Member"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4 align-middle">
                              <div className="min-w-0">
                                <p className="truncate text-[#6b5e54]">
                                  {member.email || "N/A"}
                                </p>

                                <p className="mt-1 truncate text-xs font-semibold text-[#9b6f45]">
                                  {member.phone || "N/A"}
                                </p>
                              </div>
                            </td>

                            <td className="px-5 py-4 align-middle text-[#6b5e54]">
                              <p className="truncate">{member.nic || "N/A"}</p>
                            </td>

                            <td className="px-5 py-4 align-middle text-[#6b5e54]">
                              <p className="truncate">
                                {member.employeeId || "N/A"}
                              </p>
                            </td>

                            <td className="px-5 py-4 align-middle text-[#6b5e54]">
                              <p className="truncate">
                                {member.department || "N/A"}
                              </p>
                            </td>

                            <td className="px-5 py-4 align-middle text-[#6b5e54]">
                              <p className="truncate">
                                {member.jobRole || "N/A"}
                              </p>
                            </td>

                            <td className="px-5 py-4 align-middle text-[#6b5e54]">
                              <p className="truncate">
                                {member.salaryRange || "N/A"}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-center align-middle">
                              <span
                                className={`inline-flex min-w-[118px] items-center justify-center rounded-full border px-3 py-1.5 text-xs font-extrabold capitalize ${getRoleStyle(
                                  member.role
                                )}`}
                              >
                                {(member.role || "member").replaceAll(
                                  "_",
                                  " "
                                )}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-center align-middle">
                              <span
                                className={`inline-flex min-w-[155px] items-center justify-center rounded-full border px-3 py-1.5 text-xs font-extrabold capitalize ${getStatusStyle(
                                  member.accountStatus
                                )}`}
                              >
                                {(member.accountStatus || "pending").replaceAll(
                                  "_",
                                  " "
                                )}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-center align-middle text-[#79695d]">
                              <span className="whitespace-nowrap">
                                {formatDate(member.createdAt)}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-center align-middle">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  asChild
                                  size="sm"
                                  className="h-9 rounded-xl bg-[#2c241f] px-3 text-xs font-bold text-[#fbf7ef] shadow-lg shadow-[#2c241f]/20 transition hover:bg-[#9b6f45]"
                                >
                                  <Link href={`/dashboard/admin/users/${member._id}`}>
                                    <Eye className="mr-1" size={15} />
                                    View
                                  </Link>
                                </Button>
                                {member.accountStatus !== "active" && (
                                  <Button
                                    size="sm"
                                    disabled={
                                      actionLoadingId ===
                                      `approve-${member._id}`
                                    }
                                    onClick={() =>
                                      handleUserAction(member._id, "approve")
                                    }
                                    className="h-9 rounded-xl bg-emerald-700 px-3 text-xs font-bold text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {actionLoadingId ===
                                    `approve-${member._id}` ? (
                                      <Loader2
                                        size={15}
                                        className="mr-1 animate-spin"
                                      />
                                    ) : null}
                                    Approve
                                  </Button>
                                )}

                                {member.accountStatus !== "rejected" && (
                                  <Button
                                    size="sm"
                                    disabled={
                                      actionLoadingId === `reject-${member._id}`
                                    }
                                    onClick={() =>
                                      handleUserAction(member._id, "reject")
                                    }
                                    className="h-9 rounded-xl bg-red-700 px-3 text-xs font-bold text-white shadow-lg shadow-red-700/20 transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {actionLoadingId ===
                                    `reject-${member._id}` ? (
                                      <Loader2
                                        size={15}
                                        className="mr-1 animate-spin"
                                      />
                                    ) : null}
                                    Reject
                                  </Button>
                                )}
                              </div>
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
                    {filteredMembers.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-[#9b6f45]">
                    {totalMembers}
                  </span>{" "}
                  members
                </p>

                <p>Admin can approve, reject and manage user accounts here.</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}