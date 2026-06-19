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
  BriefcaseBusiness,
  Building2,
  Eye,
  EyeOff,
  HandHeart,
  IdCard,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
  UserPlus,
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

const registerSchema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  nic: z.string().min(10, "NIC number is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),

  companyName: z.string().optional(),
  department: z.string().optional(),
  jobRole: z.string().optional(),
  salaryRange: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

const registerCards = [
  {
    title: "Member",
    description: "Apply and track welfare support",
  },
  {
    title: "Documents",
    description: "Upload and verify documents",
  },
  {
    title: "Approval",
    description: "Track admin review process",
  },
  {
    title: "Payments",
    description: "View installments and records",
  },
];

export default function RegisterPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      nic: "",
      email: "",
      phone: "",
      password: "",
      companyName: "",
      department: "",
      jobRole: "",
      salaryRange: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      setMessage("");
      setIsSuccess(false);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        setMessage(result.message || "Registration failed");
        setIsSuccess(false);
        return;
      }

      setMessage("Registration successful. Pending admin approval.");
      setIsSuccess(true);

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong");
      setIsSuccess(false);
    } finally {
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
            alt="Welfare registration background"
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
                Employee Welfare Platform
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
              href="/login"
              className="inline-flex h-12 items-center rounded-full bg-[#d8ad80] px-6 text-sm font-extrabold text-[#211b17] shadow-[0_18px_45px_rgba(90,62,35,0.25)] transition hover:-translate-y-0.5 hover:bg-[#c99b69] md:h-13 md:px-7"
            >
              Login
              <ArrowRight className="ml-2" size={17} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main content - same layout as login */}
      <section className="relative z-20 mx-auto grid min-h-[calc(100vh-104px)] max-w-[1500px] items-center gap-10 px-6 pb-10 lg:grid-cols-[48%_52%] lg:px-14">
        {/* Left framed content */}
        <div className="flex justify-center lg:justify-start">
          <div className="w-full max-w-[650px] rounded-[42px] border border-[#d9c8b8] bg-[#fbf7ef]/66 p-7 shadow-[0_35px_110px_rgba(44,36,31,0.14)] backdrop-blur-2xl md:p-9">
            <div className="inline-flex items-center gap-3 rounded-full border border-[#d9c8b8] bg-[#f8f1e8]/80 px-5 py-3 text-xs font-extrabold uppercase tracking-[0.35em] text-[#9b6f45]">
              <UserPlus size={15} />
              Member Registration
            </div>

            <h1 className="mt-8 text-5xl font-normal leading-[1.05] tracking-[-0.07em] text-[#2b241f] md:text-6xl xl:text-7xl">
              Create your welfare account
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-[#514840] md:text-lg md:leading-9">
              Register to apply for welfare loans, request emergency support,
              upload documents, receive approval letters and track payments.
            </p>

            <div className="mt-9 grid gap-4 sm:grid-cols-2">
              {registerCards.map((card) => (
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
                <h3 className="font-extrabold">Admin Approval Required</h3>
                <p className="mt-1 text-sm text-white/60">
                  New member accounts are activated after admin verification.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right register card - same position/width as login */}
        <div className="flex justify-center lg:justify-end">
          <div className="w-full max-w-[590px] rounded-[42px] border border-white/70 bg-[#fbf7ef]/94 p-7 shadow-[0_40px_130px_rgba(44,36,31,0.32)] backdrop-blur-2xl md:p-8">
            <div className="mx-auto mb-5 flex h-[74px] w-[74px] items-center justify-center rounded-full border border-[#d9c8b8] bg-[#f1e5d8] text-[#8a5f3c] shadow-[0_18px_50px_rgba(44,36,31,0.12)]">
              <User size={30} />
            </div>

            <div className="text-center">
              <p className="text-xs font-extrabold uppercase tracking-[0.42em] text-[#9b6f45]">
                Register
              </p>

              <h2 className="mt-4 text-4xl font-normal tracking-[-0.05em] text-[#2b241f] md:text-5xl">
                Create Account
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#5f554d]">
                Fill your details to create a new Welfare member account.
              </p>
            </div>

            <Card className="mt-6 border-0 bg-transparent shadow-none">
              <CardContent className="p-0">
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-4"
                  autoComplete="off"
                >
                  <input
                    type="text"
                    name="fake-user"
                    title="Do not fill this field"
                    aria-label="Do not fill this field"
                    placeholder="Do not fill this field"
                    autoComplete="username"
                    className="hidden"
                    tabIndex={-1}
                  />

                  <input
                    type="password"
                    name="fake-password"
                    title="Do not fill this password field"
                    aria-label="Do not fill this password field"
                    placeholder="Do not fill this password field"
                    autoComplete="new-password"
                    className="hidden"
                    tabIndex={-1}
                  />

                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label className="text-xs font-bold text-[#2b241f]">
                        Full Name
                      </Label>

                      <div className="relative mt-2">
                        <User
                          size={17}
                          className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#8a5f3c]"
                        />

                        <Input
                          placeholder="Enter full name"
                          autoComplete="off"
                          className="h-12 rounded-2xl border-[#d9c8b8] bg-[#f3eadf] pl-10 text-sm text-[#2b241f] shadow-inner shadow-[#2c241f]/5 placeholder:text-[#8a7a6b] focus-visible:border-[#8a5f3c] focus-visible:ring-2 focus-visible:ring-[#8a5f3c]/25"
                          {...register("fullName")}
                        />
                      </div>

                      {errors.fullName && (
                        <p className="mt-1 text-xs font-semibold text-red-600">
                          {errors.fullName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs font-bold text-[#2b241f]">
                        NIC Number
                      </Label>

                      <div className="relative mt-2">
                        <IdCard
                          size={17}
                          className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#8a5f3c]"
                        />

                        <Input
                          placeholder="Enter NIC"
                          autoComplete="off"
                          className="h-12 rounded-2xl border-[#d9c8b8] bg-[#f3eadf] pl-10 text-sm text-[#2b241f] shadow-inner shadow-[#2c241f]/5 placeholder:text-[#8a7a6b] focus-visible:border-[#8a5f3c] focus-visible:ring-2 focus-visible:ring-[#8a5f3c]/25"
                          {...register("nic")}
                        />
                      </div>

                      {errors.nic && (
                        <p className="mt-1 text-xs font-semibold text-red-600">
                          {errors.nic.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs font-bold text-[#2b241f]">
                        Email
                      </Label>

                      <div className="relative mt-2">
                        <Mail
                          size={17}
                          className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#8a5f3c]"
                        />

                        <Input
                          type="email"
                          placeholder="Enter email"
                          autoComplete="off"
                          className="h-12 rounded-2xl border-[#d9c8b8] bg-[#f3eadf] pl-10 text-sm text-[#2b241f] shadow-inner shadow-[#2c241f]/5 placeholder:text-[#8a7a6b] focus-visible:border-[#8a5f3c] focus-visible:ring-2 focus-visible:ring-[#8a5f3c]/25"
                          {...register("email")}
                        />
                      </div>

                      {errors.email && (
                        <p className="mt-1 text-xs font-semibold text-red-600">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs font-bold text-[#2b241f]">
                        Phone Number
                      </Label>

                      <div className="relative mt-2">
                        <Phone
                          size={17}
                          className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#8a5f3c]"
                        />

                        <Input
                          placeholder="Enter phone"
                          autoComplete="off"
                          className="h-12 rounded-2xl border-[#d9c8b8] bg-[#f3eadf] pl-10 text-sm text-[#2b241f] shadow-inner shadow-[#2c241f]/5 placeholder:text-[#8a7a6b] focus-visible:border-[#8a5f3c] focus-visible:ring-2 focus-visible:ring-[#8a5f3c]/25"
                          {...register("phone")}
                        />
                      </div>

                      {errors.phone && (
                        <p className="mt-1 text-xs font-semibold text-red-600">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs font-bold text-[#2b241f]">
                        Password
                      </Label>

                      <div className="relative mt-2">
                        <Lock
                          size={17}
                          className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#8a5f3c]"
                        />

                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter password"
                          autoComplete="new-password"
                          className="h-12 rounded-2xl border-[#d9c8b8] bg-[#f3eadf] pl-10 pr-12 text-sm text-[#2b241f] shadow-inner shadow-[#2c241f]/5 placeholder:text-[#8a7a6b] focus-visible:border-[#8a5f3c] focus-visible:ring-2 focus-visible:ring-[#8a5f3c]/25"
                          {...register("password")}
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl border border-[#d9c8b8] bg-white/60 text-[#8a5f3c] transition hover:bg-[#f1e5d8]"
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <EyeOff size={17} />
                          ) : (
                            <Eye size={17} />
                          )}
                        </button>
                      </div>

                      {errors.password && (
                        <p className="mt-1 text-xs font-semibold text-red-600">
                          {errors.password.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs font-bold text-[#2b241f]">
                        Company Name
                      </Label>

                      <div className="relative mt-2">
                        <Building2
                          size={17}
                          className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#8a5f3c]"
                        />

                        <Input
                          placeholder="Enter company"
                          autoComplete="off"
                          className="h-12 rounded-2xl border-[#d9c8b8] bg-[#f3eadf] pl-10 text-sm text-[#2b241f] shadow-inner shadow-[#2c241f]/5 placeholder:text-[#8a7a6b] focus-visible:border-[#8a5f3c] focus-visible:ring-2 focus-visible:ring-[#8a5f3c]/25"
                          {...register("companyName")}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-bold text-[#2b241f]">
                        Department
                      </Label>

                      <div className="relative mt-2">
                        <BriefcaseBusiness
                          size={17}
                          className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#8a5f3c]"
                        />

                        <Input
                          placeholder="Enter department"
                          autoComplete="off"
                          className="h-12 rounded-2xl border-[#d9c8b8] bg-[#f3eadf] pl-10 text-sm text-[#2b241f] shadow-inner shadow-[#2c241f]/5 placeholder:text-[#8a7a6b] focus-visible:border-[#8a5f3c] focus-visible:ring-2 focus-visible:ring-[#8a5f3c]/25"
                          {...register("department")}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-bold text-[#2b241f]">
                        Job Role
                      </Label>

                      <Select
                        onValueChange={(value) => {
                          setValue("jobRole", value, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }}
                      >
                        <SelectTrigger className="mt-2 h-12 rounded-2xl border-[#d9c8b8] bg-[#f3eadf] text-[#2b241f] shadow-inner shadow-[#2c241f]/5 focus:ring-2 focus:ring-[#8a5f3c]/25">
                          <SelectValue placeholder="Select job role" />
                        </SelectTrigger>

                        <SelectContent className="border-[#d9c8b8] bg-[#fbf7ef] text-[#2b241f]">
                          <SelectItem value="Manager">Manager</SelectItem>
                          <SelectItem value="Assistant Manager">
                            Assistant Manager
                          </SelectItem>
                          <SelectItem value="HR Officer">HR Officer</SelectItem>
                          <SelectItem value="Accountant">Accountant</SelectItem>
                          <SelectItem value="IT Officer">IT Officer</SelectItem>
                          <SelectItem value="Software Engineer">
                            Software Engineer
                          </SelectItem>
                          <SelectItem value="Clerk">Clerk</SelectItem>
                          <SelectItem value="Receptionist">
                            Receptionist
                          </SelectItem>
                          <SelectItem value="Driver">Driver</SelectItem>
                          <SelectItem value="Technician">Technician</SelectItem>
                          <SelectItem value="Lecturer">Lecturer</SelectItem>
                          <SelectItem value="Nurse">Nurse</SelectItem>
                          <SelectItem value="Security Officer">
                            Security Officer
                          </SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs font-bold text-[#2b241f]">
                        Employee ID
                      </Label>

                      <div className="relative mt-2 flex h-12 items-center rounded-2xl border border-[#d9c8b8] bg-[#efe3d6] pl-10 pr-4 text-sm font-semibold text-[#6b5e54] shadow-inner shadow-[#2c241f]/5">
                        <IdCard
                          size={17}
                          className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#8a5f3c]"
                        />
                        Auto generated
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <Label className="text-xs font-bold text-[#2b241f]">
                        Salary Range
                      </Label>

                      <Select
                        onValueChange={(value) => {
                          setValue("salaryRange", value, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }}
                      >
                        <SelectTrigger className="mt-2 h-12 rounded-2xl border-[#d9c8b8] bg-[#f3eadf] text-[#2b241f] shadow-inner shadow-[#2c241f]/5 focus:ring-2 focus:ring-[#8a5f3c]/25">
                          <SelectValue placeholder="Select salary range" />
                        </SelectTrigger>

                        <SelectContent className="border-[#d9c8b8] bg-[#fbf7ef] text-[#2b241f]">
                          <SelectItem value="Below LKR 50,000">
                            Below LKR 50,000
                          </SelectItem>
                          <SelectItem value="LKR 50,000 - 100,000">
                            LKR 50,000 - 100,000
                          </SelectItem>
                          <SelectItem value="LKR 100,000 - 150,000">
                            LKR 100,000 - 150,000
                          </SelectItem>
                          <SelectItem value="Above LKR 150,000">
                            Above LKR 150,000
                          </SelectItem>
                          <SelectItem value="Prefer not to say">
                            Prefer not to say
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {message && (
                    <div
                      className={`rounded-2xl border p-3 text-sm font-semibold ${
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
                    className="h-[54px] w-full rounded-2xl bg-[#9b6f45] text-sm font-extrabold text-white shadow-[0_20px_55px_rgba(91,60,32,0.32)] transition hover:scale-[1.01] hover:bg-[#835c38]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="ml-3" size={19} />
                      </>
                    )}
                  </Button>

                  <p className="text-center text-sm text-[#6b5e54]">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="font-bold text-[#8a5f3c] transition hover:text-[#2c241f] hover:underline"
                    >
                      Login
                    </Link>
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}