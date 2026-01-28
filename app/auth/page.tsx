"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FOODZO_USER_STORAGE_KEY } from "@/lib/constants";

const copy = {
  signin: {
    title: "Sign In",
    subtitle:
      "Welcome back! Get instant access to your favourite meals and saved orders.",
    primaryCta: "Sign In",
    switchLabel: "Register",
    switchMode: "signup" as const,
    forgotLabel: "Forgot Password?",
  },
  signup: {
    title: "Sign Up",
    subtitle:
      "Create your Foodzo account and start discovering new favourites today.",
    primaryCta: "Create Account",
    switchLabel: "Sign In",
    switchMode: "signin" as const,
    forgotLabel: "",
  },
};

export default function AuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const { title, subtitle, primaryCta, switchLabel, switchMode, forgotLabel } =
    copy[mode];

  const [formValues, setFormValues] = useState({
    username: "",
    email: "",
    phone: "",
    identifier: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  type SigninSuccessPayload = {
    success: true;
    user: {
      username: string;
      email: string;
      phone: string;
      isAdmin: boolean;
    };
  };

  const isSigninSuccessPayload = (
    value: unknown
  ): value is SigninSuccessPayload => {
    if (!value || typeof value !== "object") return false;
    const parsed = value as Record<string, unknown>;
    if (parsed.success !== true) return false;
    const user = parsed.user;
    if (!user || typeof user !== "object") return false;
    const userRecord = user as Record<string, unknown>;
    return (
      typeof userRecord.username === "string" &&
      typeof userRecord.email === "string" &&
      typeof userRecord.phone === "string" &&
      typeof userRecord.isAdmin === "boolean"
    );
  };

  useEffect(() => {
    setFormValues({ username: "", email: "", phone: "", identifier: "", password: "" });
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [mode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const body =
        mode === "signup"
          ? {
              username: formValues.username,
              email: formValues.email,
              phone: formValues.phone,
              password: formValues.password,
            }
          : {
              identifier: formValues.identifier,
              password: formValues.password,
            };

      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = "error" in data && data.error ? data.error : "Something went wrong.";
        setErrorMessage(message);
        return;
      }

      if (mode === "signup") {
        setSuccessMessage("Account created! Sign in to continue.");
        router.push("/auth?mode=signin");
        return;
      }

      if (mode === "signin" && isSigninSuccessPayload(data)) {
        try {
          localStorage.setItem(FOODZO_USER_STORAGE_KEY, JSON.stringify(data.user));
        } catch (storageError) {
          console.warn("Unable to persist user session", storageError);
        }
      }

      setSuccessMessage("Signed in successfully! Redirecting...");
      router.push("/home");
    } catch (error) {
      console.error("Auth submit error", error);
      setErrorMessage("Unable to connect. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const navigateToMode = () => {
    router.push(`/auth?mode=${switchMode}`);
  };

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-[#fff6e5] text-[#2b1b08]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,239,204,0.65),_transparent_62%)]"></div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#ffcf4d] via-[#ffb027] to-[#ffe9c7] opacity-95"></div>

      <main className="relative z-10 flex flex-1 flex-col overflow-y-auto">
        <header className="flex flex-col gap-[clamp(0.65rem,2.6vh,1.4rem)] px-[clamp(1.1rem,5vw,2.2rem)] pt-[clamp(1.3rem,4.4vh,2.2rem)] pb-[clamp(0.7rem,2.6vh,1.4rem)] text-[#2b1b08]">
          <div className="flex items-center justify-between text-sm font-semibold uppercase tracking-[0.22em] text-[#2a190a]/80">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-xs font-semibold text-[#2a190a] shadow-[0_10px_24px_rgba(0,0,0,0.08)] transition hover:translate-x-[-2px] hover:bg-white"
            >
              <span className="text-lg leading-none">←</span>
              Home
            </Link>
            <button
              type="button"
              onClick={navigateToMode}
              className="rounded-full bg-white/85 px-4 py-2 text-xs font-semibold text-[#2a190a] shadow-[0_10px_24px_rgba(0,0,0,0.08)] transition hover:-translate-y-[1px] hover:bg-white"
            >
              {switchLabel}
            </button>
          </div>

          <div className="flex flex-col gap-[clamp(0.75rem,2.6vh,1.3rem)]">
            <h1 className="text-[clamp(28px,7vw,38px)] font-semibold leading-tight text-[#2b210f]">
              {title}
            </h1>
            <p className="max-w-[320px] text-[clamp(13px,3.3vw,16px)] leading-relaxed text-[#402a14]/85">
              {subtitle}
            </p>
          </div>
        </header>

        <section className="flex flex-1 flex-col px-[clamp(0.35rem,2.6vw,0.9rem)] pt-[0px] pb-[clamp(0.35rem,2.2vh,0.8rem)]">
          <div className="mx-auto w-[min(95vw,340px)] box-border rounded-[clamp(14px,4vw,20px)] bg-white px-[clamp(0.7rem,2.6vw,1.05rem)] pt-[clamp(0.85rem,2.8vh,1.35rem)] pb-[clamp(0.5rem,1.8vh,0.85rem)] shadow-[0_18px_32px_rgba(239,163,25,0.18)]">
            <form className="flex flex-col gap-[clamp(0.45rem,1.8vh,0.72rem)]" onSubmit={handleSubmit}>
              {mode === "signup" ? (
                <>
                  <label className="flex flex-col gap-3 text-sm font-semibold text-[#2b210f]">
                    <span className="pl-2 text-xs uppercase tracking-[0.26em] text-[#bf8a39]">
                      Username
                    </span>
                    <input
                      type="text"
                      placeholder="Choose a username"
                      className="w-full rounded-full border-none bg-[#fff6e7] px-4 py-[clamp(0.44rem,1.6vh,0.64rem)] text-[13.5px] text-[#2b210f] placeholder:text-[#bf9d6a] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb53d]"
                      value={formValues.username}
                      onChange={handleInputChange("username")}
                      required
                    />
                  </label>

                  <label className="flex flex-col gap-2 text-sm font-semibold text-[#2b210f]">
                    <span className="pl-2 text-xs uppercase tracking-[0.26em] text-[#bf8a39]">
                      Email
                    </span>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      className="w-full rounded-full border-none bg-[#fff6e7] px-4 py-[clamp(0.44rem,1.6vh,0.64rem)] text-[13.5px] text-[#2b210f] placeholder:text-[#bf9d6a] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb53d]"
                      value={formValues.email}
                      onChange={handleInputChange("email")}
                      required
                    />
                  </label>

                  <label className="flex flex-col gap-3 text-sm font-semibold text-[#2b210f]">
                    <span className="pl-2 text-xs uppercase tracking-[0.26em] text-[#bf8a39]">
                      Phone Number
                    </span>
                    <input
                      type="tel"
                      placeholder="Include country code if outside India"
                      className="w-full rounded-full border-none bg-[#fff6e7] px-4 py-[clamp(0.44rem,1.6vh,0.64rem)] text-[13.5px] text-[#2b210f] placeholder:text-[#bf9d6a] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb53d]"
                      value={formValues.phone}
                      onChange={handleInputChange("phone")}
                      required
                    />
                    <span className="pl-2 text-xs font-medium uppercase tracking-[0.22em] text-[#c5934b]">
                      Use digits only, e.g. +919876543210
                    </span>
                  </label>

                  <label className="flex flex-col gap-2 text-sm font-semibold text-[#2b210f]">
                    <span className="pl-2 text-xs uppercase tracking-[0.26em] text-[#bf8a39]">
                      Password
                    </span>
                    <input
                      type="password"
                      placeholder="Create a password"
                      className="w-full rounded-full border-none bg-[#fff6e7] px-4 py-[clamp(0.44rem,1.6vh,0.64rem)] text-[13.5px] text-[#2b210f] placeholder:text-[#bf9d6a] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb53d]"
                      value={formValues.password}
                      onChange={handleInputChange("password")}
                      required
                    />
                  </label>
                </>
              ) : (
                <>
                  <label className="flex flex-col gap-3 text-sm font-semibold text-[#2b210f]">
                    <span className="pl-2 text-xs uppercase tracking-[0.26em] text-[#bf8a39]">
                      Email or Phone Number
                    </span>
                    <input
                      type="text"
                      placeholder="Enter email or phone number"
                      className="w-full rounded-full border-none bg-[#fff6e7] px-4 py-[clamp(0.44rem,1.6vh,0.64rem)] text-[13.5px] text-[#2b210f] placeholder:text-[#bf9d6a] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb53d]"
                      value={formValues.identifier}
                      onChange={handleInputChange("identifier")}
                      required
                    />
                    <span className="pl-2 text-xs font-medium uppercase tracking-[0.22em] text-[#c5934b]">
                      Example: user@foodzo.com or +919876543210
                    </span>
                  </label>

                  <label className="flex flex-col gap-2 text-sm font-semibold text-[#2b210f]">
                    <span className="pl-2 text-xs uppercase tracking-[0.26em] text-[#bf8a39]">
                      Password
                    </span>
                    <input
                      type="password"
                      placeholder="Your password"
                      className="w-full rounded-full border-none bg-[#fff6e7] px-4 py-[clamp(0.44rem,1.6vh,0.64rem)] text-[13.5px] text-[#2b210f] placeholder:text-[#bf9d6a] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb53d]"
                      value={formValues.password}
                      onChange={handleInputChange("password")}
                      required
                    />
                  </label>

                  {forgotLabel && (
                    <button
                      type="button"
                      className="self-end text-xs font-semibold text-[#2b210f]/75 transition hover:text-[#2b210f]"
                    >
                      {forgotLabel}
                    </button>
                  )}
                </>
              )}

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-[#111]/95 px-4 py-[clamp(0.44rem,1.6vh,0.64rem)] text-[clamp(12px,2.6vw,13.5px)] font-semibold text-white shadow-[0_14px_24px_rgba(0,0,0,0.24)] transition hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Please wait..." : primaryCta}
              </button>
            </form>

            {(errorMessage || successMessage) && (
              <div
                className={`mt-[clamp(0.65rem,2.2vh,1.1rem)] rounded-[18px] px-4 py-[clamp(0.45rem,1.6vh,0.7rem)] text-sm font-semibold ${
                  errorMessage
                    ? "bg-[#fff0e5] text-[#7a2b12] shadow-[0_12px_24px_rgba(199,59,36,0.16)]"
                    : "bg-[#f1ffe5] text-[#1f5220] shadow-[0_12px_24px_rgba(63,149,32,0.16)]"
                }`}
                role="status"
                aria-live="polite"
              >
                {errorMessage ?? successMessage}
              </div>
            )}

            <div className="mt-[clamp(1rem,3vh,1.4rem)] flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#d2b280]">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#e2c67f] to-transparent"></span>
              or
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#e2c67f] to-transparent"></span>
            </div>

            <button
              type="button"
              className="mt-[clamp(0.7rem,2.2vh,1.1rem)] flex w-full items-center justify-between rounded-[18px] bg-white px-5 py-[clamp(0.65rem,2.4vh,0.9rem)] text-[14px] font-semibold text-[#2b2108] shadow-[0_20px_30px_rgba(239,163,25,0.16)] transition hover:-translate-y-[1px]"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ffeecc] text-[16px] font-bold text-[#f2a100]">
                  G
                </span>
                Continue with Google
              </span>
              <span className="text-xl">→</span>
            </button>
            <button
              type="button"
              onClick={() => router.push("/home")}
              className="mt-[clamp(0.55rem,1.8vh,0.9rem)] w-full text-center text-[12.5px] font-semibold text-[#2b210f] underline decoration-[#c08a31] decoration-2 underline-offset-4 transition hover:text-[#c27b00]"
            >
              Explore app without authentication
            </button>
          </div>
          <p className="mt-[clamp(0.85rem,2.6vh,1.4rem)] text-center text-[clamp(12px,3vw,15px)] font-semibold text-[#3b260f]/85">
            Your Taste is our first priority 👌
          </p>
        </section>
      </main>
    </div>
  );
}
