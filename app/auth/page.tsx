"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";

import { FOODZO_USER_STORAGE_KEY } from "@/lib/constants";
import { getFirebaseClientAuth, getGoogleAuthProvider } from "@/lib/firebaseClient";

export default function AuthPage() {
  const router = useRouter();
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [needsPhone, setNeedsPhone] = useState(false);
  const [pendingIdToken, setPendingIdToken] = useState<string | null>(null);
  const [phoneValue, setPhoneValue] = useState("");
  const [isPhoneSubmitting, setIsPhoneSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusVariant, setStatusVariant] = useState<"error" | "success">("success");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(FOODZO_USER_STORAGE_KEY);
      if (stored) {
        router.replace("/home");
      }
    } catch (error) {
      console.warn("Failed to read stored user", error);
    }
  }, [router]);

  const resetStatus = () => {
    setStatusMessage(null);
  };

  const handleGoogleSignIn = async () => {
    if (isGoogleSigningIn) return;

    setIsGoogleSigningIn(true);
    setNeedsPhone(false);
    setPendingIdToken(null);
    setPhoneValue("");
    resetStatus();

    try {
      const auth = getFirebaseClientAuth();
      const provider = getGoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (!response.ok || !data || data.success !== true) {
        const message = data?.error ?? "Unable to sign in with Google.";
        setStatusVariant("error");
        setStatusMessage(message);
        return;
      }

      if (data.requiresPhone === true) {
        setPendingIdToken(idToken);
        setNeedsPhone(true);
        setStatusVariant("success");
        setStatusMessage("Add your phone number to finish setting up your account.");
        return;
      }

      try {
        localStorage.setItem(FOODZO_USER_STORAGE_KEY, JSON.stringify(data.user));
      } catch (storageError) {
        console.warn("Unable to persist user session", storageError);
      }

      setStatusVariant("success");
      setStatusMessage("Signed in with Google! Redirecting...");
      router.replace("/home");
    } catch (error) {
      console.error("Google auth error", error);
      setStatusVariant("error");
      setStatusMessage("Google sign-in failed or was closed. Please try again.");
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const handlePhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPhoneValue(event.target.value);
  };

  const handlePhoneSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPhoneSubmitting) return;

    if (!pendingIdToken) {
      setStatusVariant("error");
      setStatusMessage("Session expired. Please sign in with Google again.");
      setNeedsPhone(false);
      return;
    }

    const trimmedPhone = phoneValue.trim();
    if (!trimmedPhone) {
      setStatusVariant("error");
      setStatusMessage("Please enter your phone number.");
      return;
    }

    setIsPhoneSubmitting(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/auth/phone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken: pendingIdToken, phone: trimmedPhone }),
      });

      const data = await response.json();

      if (!response.ok || !data || data.success !== true) {
        const message = data?.error ?? "Unable to save phone number.";
        setStatusVariant("error");
        setStatusMessage(message);
        return;
      }

      try {
        localStorage.setItem(FOODZO_USER_STORAGE_KEY, JSON.stringify(data.user));
      } catch (storageError) {
        console.warn("Unable to persist user session", storageError);
      }

      setStatusVariant("success");
      setStatusMessage("Phone number saved! Redirecting...");
      setNeedsPhone(false);
      router.replace("/home");
    } catch (error) {
      console.error("Phone submission error", error);
      setStatusVariant("error");
      setStatusMessage("Something went wrong. Please try again.");
    } finally {
      setIsPhoneSubmitting(false);
    }
  };

  return (
    <div className="relative flex h-dvh flex-col items-center justify-center overflow-hidden bg-[#fff6e5] text-[#2b1b08]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,239,204,0.65),_transparent_62%)]"></div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#ffcf4d] via-[#ffb027] to-[#ffe9c7] opacity-95"></div>

      <main className="relative z-10 w-[min(92vw,360px)] rounded-[26px] bg-white/95 px-[clamp(1.4rem,5vw,2.4rem)] py-[clamp(2rem,6vh,3rem)] text-center shadow-[0_26px_44px_rgba(239,163,25,0.22)]">
        <div className="flex flex-col items-center gap-5">
          <span className="inline-flex items-center rounded-full bg-[#fff1cc] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#d28c20]">
            Foodzo Access
          </span>
          <h1 className="text-[clamp(28px,6vw,36px)] font-semibold leading-tight text-[#1f1406]">
            {needsPhone ? "Add your phone" : "Sign in to continue"}
          </h1>
          <p className="text-sm font-semibold text-[#482b11]/80">
            {needsPhone
              ? "We need your phone number to complete your Foodzo profile."
              : "Use your Google account to sync favourites, orders, and admin controls securely."}
          </p>

          {needsPhone ? (
            <form className="mt-2 flex w-full flex-col gap-4" onSubmit={handlePhoneSubmit}>
              <label className="flex flex-col gap-2 text-left text-sm font-semibold text-[#2b210f]">
                <span className="pl-2 text-xs uppercase tracking-[0.28em] text-[#bf8a39]">
                  Phone Number
                </span>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="e.g. +919876543210"
                  value={phoneValue}
                  onChange={handlePhoneChange}
                  className="w-full rounded-full border-none bg-[#fff6e7] px-4 py-3 text-sm text-[#2b210f] placeholder:text-[#bf9d6a] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb53d]"
                  required
                />
                <span className="pl-2 text-xs font-medium uppercase tracking-[0.24em] text-[#c5934b]">
                  Include country code. Digits and a single leading + are allowed.
                </span>
              </label>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-[#111]/95 px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_34px_rgba(0,0,0,0.26)] transition hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isPhoneSubmitting}
              >
                {isPhoneSubmitting ? "Saving..." : "Save and continue"}
              </button>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2b210f] underline decoration-[#c08a31] decoration-2 underline-offset-4 transition hover:text-[#c27b00]"
                disabled={isPhoneSubmitting}
              >
                Restart Google sign-in
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="mt-2 flex w-full items-center justify-center gap-3 rounded-full bg-[#111]/95 px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_34px_rgba(0,0,0,0.26)] transition hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isGoogleSigningIn}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg font-bold text-[#ea4335]">
                G
              </span>
              {isGoogleSigningIn ? "Connecting..." : "Continue with Google"}
            </button>
          )}

          {statusMessage && (
            <div
              className={`w-full rounded-[18px] px-4 py-3 text-sm font-semibold shadow-[0_12px_24px_rgba(0,0,0,0.12)] ${
                statusVariant === "error"
                  ? "bg-[#fff0e5] text-[#7a2b12] shadow-[0_12px_24px_rgba(199,59,36,0.18)]"
                  : "bg-[#f1ffe5] text-[#1f5220] shadow-[0_12px_24px_rgba(63,149,32,0.16)]"
              }`}
              role="status"
              aria-live="polite"
            >
              {statusMessage}
            </div>
          )}

          <button
            type="button"
            onClick={() => router.push("/home")}
            className="mt-4 text-xs font-semibold uppercase tracking-[0.28em] text-[#2b210f] underline decoration-[#c08a31] decoration-2 underline-offset-4 transition hover:text-[#c27b00]"
          >
            Explore without signing in
          </button>
        </div>
      </main>
    </div>
  );
}
