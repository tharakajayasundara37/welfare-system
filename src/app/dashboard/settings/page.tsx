"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useState } from "react";

import {
  Camera,
  CheckCircle2,
  Loader2,
  Moon,
  Palette,
  Settings,
  Sun,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboardTheme } from "@/components/theme/DashboardThemeProvider";

type ThemeMode = "light" | "dark";

type ProfileUser = {
  fullName: string;
  email: string;
  role: string;
  accountStatus: string;
  profileImage?: string;
  themeMode?: ThemeMode;
  themeColor?: string;
};

type ProfileResponse = {
  success: boolean;
  message?: string;
  user?: ProfileUser;
};

const colorOptions = [
  { label: "Welfare Brown", value: "#9b6f45" },
  { label: "Royal Blue", value: "#2563eb" },
  { label: "Emerald", value: "#047857" },
  { label: "Purple", value: "#7c3aed" },
  { label: "Red", value: "#dc2626" },
  { label: "Teal", value: "#0f766e" },
];

function getInitials(nameOrEmail: string) {
  const value = nameOrEmail.trim();

  if (!value) return "U";

  const namePart = value.includes("@") ? value.split("@")[0] : value;

  return namePart
    .split(" ")
    .filter(Boolean)
    .map((item) => item[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatRole(role?: string) {
  return String(role || "member")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AccountSettingsPage() {
  const { setThemeMode, setThemeColor } = useDashboardTheme();

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [selectedMode, setSelectedMode] = useState<ThemeMode>("light");
  const [selectedColor, setSelectedColor] = useState("#9b6f45");

  const [loading, setLoading] = useState(true);
  const [savingTheme, setSavingTheme] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  async function loadProfile() {
    try {
      setLoading(true);

      const response = await fetch("/api/profile", {
        method: "GET",
        cache: "no-store",
      });

      const result = (await response.json()) as ProfileResponse;

      if (!result.success || !result.user) {
        setMessage(result.message || "Failed to load settings.");
        setIsSuccess(false);
        return;
      }

      const themeMode = result.user.themeMode === "dark" ? "dark" : "light";
      const themeColor = result.user.themeColor || "#9b6f45";

      setUser(result.user);
      setSelectedMode(themeMode);
      setSelectedColor(themeColor);

      setThemeMode(themeMode);
      setThemeColor(themeColor);
    } catch (error) {
      console.error("LOAD_SETTINGS_ERROR", error);
      setMessage("Failed to load settings.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  }

useEffect(() => {
  const timer = window.setTimeout(() => {
    void loadProfile();
  }, 0);

  return () => {
    window.clearTimeout(timer);
  };
}, []);

  async function handleThemeSave() {
    try {
      setSavingTheme(true);
      setMessage("");
      setIsSuccess(false);

      const response = await fetch("/api/profile/theme", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          themeMode: selectedMode,
          themeColor: selectedColor,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setMessage(result.message || "Failed to save settings.");
        setIsSuccess(false);
        return;
      }

      setThemeMode(selectedMode);
      setThemeColor(selectedColor);

      setUser((prev) =>
        prev
          ? {
              ...prev,
              themeMode: selectedMode,
              themeColor: selectedColor,
            }
          : prev
      );

      setMessage(result.message || "Settings saved successfully.");
      setIsSuccess(true);
    } catch (error) {
      console.error("SAVE_SETTINGS_ERROR", error);
      setMessage("Failed to save settings.");
      setIsSuccess(false);
    } finally {
      setSavingTheme(false);
    }
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    try {
      const file = event.target.files?.[0];

      if (!file) return;

      setUploadingImage(true);
      setMessage("");
      setIsSuccess(false);

      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/profile/upload-image", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success || !result.imageUrl) {
        setMessage(result.message || "Failed to upload profile picture.");
        setIsSuccess(false);
        return;
      }

      setUser((prev) =>
        prev
          ? {
              ...prev,
              profileImage: result.imageUrl,
            }
          : prev
      );

      setMessage(result.message || "Profile picture updated successfully.");
      setIsSuccess(true);
    } catch (error) {
      console.error("UPLOAD_PROFILE_IMAGE_ERROR", error);
      setMessage("Failed to upload profile picture.");
      setIsSuccess(false);
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  }

  function previewMode(mode: ThemeMode) {
    setSelectedMode(mode);
    setThemeMode(mode);
  }

  function previewColor(color: string) {
    setSelectedColor(color);
    setThemeColor(color);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[#2b241f]">
        <Loader2 className="mr-2 animate-spin text-[#9b6f45]" />
        Loading account settings...
      </div>
    );
  }

  const displayName = user?.fullName || user?.email || "User";
  const initials = getInitials(displayName);

  return (
    <div className="min-h-screen overflow-hidden rounded-[34px] bg-[var(--bg-primary,#eee6da)] text-[var(--text-primary,#2b241f)]">
      <div className="relative min-h-screen space-y-7 overflow-hidden p-1">
        <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] rounded-full bg-[#c99b69]/25 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-[480px] w-[480px] rounded-full bg-[#2c241f]/10 blur-[140px]" />

        <section className="relative overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[var(--bg-card,#fbf7ef)]/90 p-7 shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-[var(--theme-color,#9b6f45)]">
            Account
          </p>

          <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
            Account Settings
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b5e54]">
            Manage profile picture, light/dark mode and system accent color.
          </p>
        </section>

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

        <section className="relative grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[var(--bg-card,#fbf7ef)]/90 text-[var(--text-primary,#2b241f)] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="p-6 text-center">
              <div className="mx-auto flex justify-center">
                <div className="relative h-36 w-36 overflow-hidden rounded-[34px] border border-[#d8ad80]/45 bg-gradient-to-br from-[#d8ad80] to-[var(--theme-color,#9b6f45)] text-white shadow-[0_18px_55px_rgba(155,111,69,0.28)]">
                  {user?.profileImage ? (
                    <Image
                      src={user.profileImage}
                      alt="Profile"
                      fill
                      sizes="144px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl font-extrabold">
                      {initials}
                    </div>
                  )}
                </div>
              </div>

              <label className="mt-5 inline-flex cursor-pointer items-center justify-center rounded-2xl bg-[var(--theme-color,#9b6f45)] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-[#9b6f45]/25 transition hover:opacity-90">
                {uploadingImage ? (
                  <Loader2 className="mr-2 animate-spin" size={17} />
                ) : (
                  <Camera className="mr-2" size={17} />
                )}
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>

              <h2 className="mt-6 text-2xl font-extrabold">{displayName}</h2>

              <p className="mt-1 text-sm font-semibold text-[var(--theme-color,#9b6f45)]">
                {formatRole(user?.role)}
              </p>

              <div className="mt-6 grid gap-3 text-left">
                <div className="rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/70 p-4">
                  <p className="text-xs font-bold text-[#6b5e54]">Email</p>
                  <p className="mt-1 truncate text-sm font-extrabold">
                    {user?.email || "N/A"}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/70 p-4">
                  <p className="text-xs font-bold text-[#6b5e54]">Status</p>
                  <p className="mt-1 truncate text-sm font-extrabold capitalize">
                    {user?.accountStatus || "active"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[var(--bg-card,#fbf7ef)]/90 text-[var(--text-primary,#2b241f)] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-[var(--theme-color,#9b6f45)]">
                  <Settings size={22} />
                </div>

                <div>
                  <h2 className="text-2xl font-extrabold">
                    Theme Preferences
                  </h2>
                  <p className="text-sm text-[#6b5e54]">
                    Choose appearance and accent color.
                  </p>
                </div>
              </div>

              <div className="grid gap-5">
                <div>
                  <h3 className="text-sm font-extrabold text-[#6b5e54]">
                    Appearance Mode
                  </h3>

                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => previewMode("light")}
                      className={`rounded-3xl border p-5 text-left transition ${
                        selectedMode === "light"
                          ? "border-[var(--theme-color,#9b6f45)] bg-[#f1e5d8]"
                          : "border-[#d9c8b8] bg-[#fffaf3] hover:bg-[#f8f1e8]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Sun
                          className="text-[var(--theme-color,#9b6f45)]"
                          size={23}
                        />
                        <div>
                          <p className="font-extrabold text-[#2b241f]">
                            Light Mode
                          </p>
                          <p className="mt-1 text-sm text-[#6b5e54]">
                            Default clean welfare theme.
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => previewMode("dark")}
                      className={`rounded-3xl border p-5 text-left transition ${
                        selectedMode === "dark"
                          ? "border-[var(--theme-color,#9b6f45)] bg-[#2c241f] text-white"
                          : "border-[#d9c8b8] bg-[#fffaf3] hover:bg-[#f8f1e8]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Moon
                          className={
                            selectedMode === "dark"
                              ? "text-[#d8ad80]"
                              : "text-[var(--theme-color,#9b6f45)]"
                          }
                          size={23}
                        />
                        <div>
                          <p
                            className={`font-extrabold ${
                              selectedMode === "dark"
                                ? "text-white"
                                : "text-[#2b241f]"
                            }`}
                          >
                            Dark Mode
                          </p>
                          <p
                            className={`mt-1 text-sm ${
                              selectedMode === "dark"
                                ? "text-[#ead9c8]/70"
                                : "text-[#6b5e54]"
                            }`}
                          >
                            Dark interface with same accent color.
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-[#6b5e54]">
                    Theme Color
                  </h3>

                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    {colorOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => previewColor(option.value)}
                        className={`rounded-3xl border p-4 text-left transition ${
                          selectedColor === option.value
                            ? "border-[#2c241f] bg-[#fffaf3] shadow-lg shadow-[#2c241f]/10"
                            : "border-[#d9c8b8] bg-[#f8f1e8]/70 hover:bg-[#fffaf3]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="h-10 w-10 rounded-2xl border border-white shadow"
                            style={{ backgroundColor: option.value }}
                          />

                          <div>
                            <p className="font-extrabold text-[#2b241f]">
                              {option.label}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-[#6b5e54]">
                              {option.value}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className="rounded-3xl border p-6 text-white shadow-lg"
                  style={{ backgroundColor: selectedColor }}
                >
                  <div className="flex items-center gap-3">
                    <Palette size={24} />
                    <div>
                      <p className="text-sm font-bold opacity-80">Preview</p>
                      <h3 className="mt-1 text-2xl font-extrabold">
                        Welfare System Theme
                      </h3>
                    </div>
                  </div>

                  <p className="mt-3 text-sm opacity-85">
                    This color will be used as your personal highlight color.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={handleThemeSave}
                  disabled={savingTheme}
                  className="h-12 rounded-2xl bg-[#2c241f] font-extrabold text-white shadow-lg shadow-[#2c241f]/20 hover:bg-[var(--theme-color,#9b6f45)]"
                >
                  {savingTheme ? (
                    <Loader2 className="mr-2 animate-spin" size={18} />
                  ) : (
                    <CheckCircle2 className="mr-2" size={18} />
                  )}
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}