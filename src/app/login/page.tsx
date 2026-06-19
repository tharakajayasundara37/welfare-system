"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  HandHeart,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginResponse {
  success: boolean;
  message?: string;
  user?: {
    _id?: string;
    fullName?: string;
    email?: string;
    role?: string;
  };
}

const accessCards = [
  {
    title: "Member",
    description: "Apply and track welfare support",
  },
  {
    title: "Officer",
    description: "Verify applications and documents",
  },
  {
    title: "Admin",
    description: "Approve and monitor records",
  },
  {
    title: "Finance",
    description: "Manage disbursement and payments",
  },
];

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const redirectByRole = (role?: string) => {
    if (role === "admin") {
      router.push("/dashboard/admin");
      return;
    }

    if (role === "welfare_officer") {
      router.push("/dashboard/officer");
      return;
    }

    if (role === "finance_officer") {
      router.push("/dashboard/finance");
      return;
    }

    if (role === "member") {
      router.push("/dashboard");
      return;
    }

    router.push("/dashboard");
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      setMessage("");
      setIsSuccess(false);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          rememberMe,
        }),
      });

      const contentType = response.headers.get("content-type");

      if (!contentType?.includes("application/json")) {
        throw new Error("API returned HTML instead of JSON");
      }

      const result = (await response.json()) as LoginResponse;

      if (!response.ok || !result.success) {
        setMessage(result.message || "Login failed");
        setIsSuccess(false);
        setLoading(false);
        return;
      }

      setMessage("Login successful. Redirecting...");
      setIsSuccess(true);

      window.setTimeout(() => {
        redirectByRole(result.user?.role);
      }, 800);
    } catch (error) {
      console.error("LOGIN_ERROR", error);
      setMessage("Something went wrong while logging in");
      setIsSuccess(false);
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#eee6da] text-[#2b241f]">
      {/* Background */}
      <div className="absolute inset-0 grid lg:grid-cols-[48%_52%]">
        <div className="bg-[#eee6da]" />

        <div className="relative hidden overflow-hidden lg:block">
          <Image
            src="/images/home/loan-digital.jpg"
            alt="WelfareX internal system background"
            fill
            priority
            className="object-cover"
          />

          <div className="absolute inset-0 bg-[#2c241f]/46" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#eee6da]/72 via-[#eee6da]/25 to-[#2c241f]/62" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#eee6da]/10 via-transparent to-[#2c241f]/35" />
        </div>
      </div>

      <div className="pointer-events-none absolute -left-44 top-0 h-[460px] w-[460px] rounded-full bg-[#c99b69]/25 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-[380px] w-[380px] rounded-full bg-[#d8ad80]/25 blur-[130px]" />

      {/* Header */}
      <header className="relative z-30">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-6 lg:px-14">
          <Link href="/" className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#cdb9a6] bg-[#f8f1e8] text-[#8a5f3c] shadow-[0_14px_40px_rgba(44,36,31,0.12)]">
              <HandHeart size={27} strokeWidth={2.2} />
            </div>

            <div>
              <h1 className="text-3xl font-extrabold leading-none tracking-[-0.04em] text-[#2b241f]">
                Welfare
              </h1>
              <p className="mt-2 text-sm font-semibold tracking-[0.08em] text-[#79695d]">
                Internal Welfare Management System
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="hidden rounded-full border border-[#d9c8b8] bg-[#f8f1e8]/75 px-6 py-3 text-sm font-bold text-[#2b241f] shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white md:inline-flex"
            >
              Back to Intro Page
            </Link>

            <Link
              href="/register"
              className="inline-flex h-12 items-center rounded-full bg-[#d8ad80] px-6 text-sm font-extrabold text-[#211b17] shadow-[0_18px_45px_rgba(90,62,35,0.25)] transition hover:-translate-y-0.5 hover:bg-[#c99b69] md:h-14 md:px-7"
            >
              Create Account
              <ArrowRight className="ml-2" size={17} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <section className="relative z-20 mx-auto grid min-h-[calc(100vh-104px)] max-w-[1500px] items-center gap-10 px-6 pb-10 lg:grid-cols-[48%_52%] lg:px-14">
        {/* Left framed content */}
        <div className="flex justify-center lg:justify-start">
          <div className="w-full max-w-[650px] rounded-[42px] border border-[#d9c8b8] bg-[#fbf7ef]/66 p-7 shadow-[0_35px_110px_rgba(44,36,31,0.14)] backdrop-blur-2xl md:p-9">
            <div className="inline-flex items-center gap-3 rounded-full border border-[#d9c8b8] bg-[#f8f1e8]/80 px-5 py-3 text-xs font-extrabold uppercase tracking-[0.35em] text-[#9b6f45]">
              <ShieldCheck size={15} />
              Secure Welfare Access
            </div>

            <h1 className="mt-8 text-5xl font-normal leading-[1.05] tracking-[-0.07em] text-[#2b241f] md:text-6xl xl:text-7xl">
              Welcome back to your system
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-[#514840] md:text-lg md:leading-9">
              Login to manage welfare loans, emergency support, approval
              letters, installment tracking and secure member records.
            </p>

            <div className="mt-9 grid gap-4 sm:grid-cols-2">
              {accessCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-[26px] border border-[#d9c8b8] bg-[#fbf7ef]/76 p-5 shadow-[0_18px_55px_rgba(44,36,31,0.08)] backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/70"
                >
                  <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-[#9b6f45]">
                    {card.title}
                  </p>

                  <p className="mt-4 text-sm font-semibold leading-6 text-[#3d342d]">
                    {card.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 rounded-[28px] border border-[#d9c8b8] bg-[#2c241f] p-5 text-white shadow-[0_22px_60px_rgba(44,36,31,0.24)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d8ad80]/25 bg-[#d8ad80]/10 text-[#d8ad80]">
                <ShieldCheck size={22} />
              </div>

              <div>
                <h3 className="font-extrabold">Protected Login Access</h3>
                <p className="mt-1 text-sm text-white/60">
                  Role-based secure dashboard access for every user.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right login card */}
        <div className="flex justify-center lg:justify-end">
          <div className="w-full max-w-[590px] rounded-[42px] border border-white/70 bg-[#fbf7ef]/94 p-7 shadow-[0_40px_130px_rgba(44,36,31,0.32)] backdrop-blur-2xl md:p-10">
            <div className="mx-auto mb-8 flex h-[74px] w-[74px] items-center justify-center rounded-full border border-[#d9c8b8] bg-[#f1e5d8] text-[#8a5f3c] shadow-[0_18px_50px_rgba(44,36,31,0.12)]">
              <Lock size={30} />
            </div>

            <div className="text-center">
              <p className="text-xs font-extrabold uppercase tracking-[0.42em] text-[#9b6f45]">
                Login
              </p>

              <h2 className="mt-5 text-4xl font-normal tracking-[-0.05em] text-[#2b241f] md:text-5xl">
                Sign in to account
              </h2>

              <p className="mt-4 text-base leading-7 text-[#5f554d]">
                Use your registered email and password to continue.
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="mt-9 space-y-6"
              autoComplete="off"
            >
              <div>
                <Label className="text-sm font-semibold text-[#2b241f]">
                  Email Address
                </Label>

                <div className="relative mt-3">
                  <Mail
                    size={19}
                    className="pointer-events-none absolute left-5 top-1/2 z-10 -translate-y-1/2 text-[#8a5f3c]"
                  />

                  <Input
                    type="email"
                    placeholder="Enter email address"
                    autoComplete="email"
                    className="h-16 rounded-2xl border-[#d9c8b8] bg-[#f3eadf] pl-14 text-base text-[#2b241f] shadow-inner shadow-[#2c241f]/5 placeholder:text-[#8a7a6b] focus-visible:border-[#8a5f3c] focus-visible:ring-2 focus-visible:ring-[#8a5f3c]/25"
                    {...register("email")}
                  />
                </div>

                {errors.email && (
                  <p className="mt-2 text-xs font-semibold text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-sm font-semibold text-[#2b241f]">
                  Password
                </Label>

                <div className="relative mt-3">
                  <Lock
                    size={19}
                    className="pointer-events-none absolute left-5 top-1/2 z-10 -translate-y-1/2 text-[#8a5f3c]"
                  />

                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    className="h-16 rounded-2xl border-[#d9c8b8] bg-[#f3eadf] pl-14 pr-14 text-base text-[#2b241f] shadow-inner shadow-[#2c241f]/5 placeholder:text-[#8a7a6b] focus-visible:border-[#8a5f3c] focus-visible:ring-2 focus-visible:ring-[#8a5f3c]/25"
                    {...register("password")}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-[#d9c8b8] bg-white/60 text-[#8a5f3c] transition hover:bg-[#f1e5d8]"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>

                {errors.password && (
                  <p className="mt-2 text-xs font-semibold text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#5f554d]">
                  <button
                    type="button"
                    onClick={() => setRememberMe((prev) => !prev)}
                    className={`flex h-5 w-5 items-center justify-center rounded border transition ${
                      rememberMe
                        ? "border-[#9b6f45] bg-[#9b6f45] text-white"
                        : "border-[#bfa993] bg-transparent text-transparent"
                    }`}
                    aria-label="Remember me"
                  >
                    <Check size={13} />
                  </button>
                  Remember me
                </label>

                <button
                  type="button"
                  className="text-sm font-semibold text-[#9b6f45] transition hover:text-[#2b241f] hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {message && (
                <div
                  className={`rounded-2xl border p-4 text-sm font-semibold ${
                    isSuccess
                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700"
                      : "border-red-500/25 bg-red-500/10 text-red-700"
                  }`}
                >
                  {message}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="h-16 w-full rounded-2xl bg-[#9b6f45] text-base font-extrabold text-white shadow-[0_20px_55px_rgba(91,60,32,0.32)] transition hover:scale-[1.01] hover:bg-[#835c38] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Login
                    <ArrowRight className="ml-3" size={19} />
                  </>
                )}
              </Button>

              <div className="rounded-[28px] border border-[#e3d4c5] bg-white/45 p-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-3">
                    <UserCheck className="text-[#8a5f3c]" size={19} />
                    <span className="text-xs font-bold text-[#5f554d]">
                      Role Access
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <ShieldCheck className="text-[#8a5f3c]" size={19} />
                    <span className="text-xs font-bold text-[#5f554d]">
                      Secure Login
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <WalletCards className="text-[#8a5f3c]" size={19} />
                    <span className="text-xs font-bold text-[#5f554d]">
                      Payments
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-center text-sm text-[#6b5e54]">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-bold text-[#8a5f3c] transition hover:text-[#2c241f] hover:underline"
                >
                  Create account
                </Link>
              </p>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}