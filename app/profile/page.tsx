"use client";

import Image, { type StaticImageData } from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import BottomNav from "@/components/BottomNav";
import { FOODZO_USER_STORAGE_KEY } from "@/lib/constants";
import avatar1 from "@/assets/images/avtar1.png";
import avatar2 from "@/assets/images/avtar2.png";
import avatar3 from "@/assets/images/avtar3.png";
import avatar4 from "@/assets/images/avtar4.png";
import avatar5 from "@/assets/images/avtar5.png";
import avatar6 from "@/assets/images/avtar6.png";
import avatar7 from "@/assets/images/avtar7.png";
import avatar8 from "@/assets/images/avtar8.png";
import avatar9 from "@/assets/images/avtar9.png";
import avatar10 from "@/assets/images/avtar10.png";
import avatar11 from "@/assets/images/avtar11.png";
import avatar12 from "@/assets/images/avtar12.png";
import avatar13 from "@/assets/images/avtar13.png";
import avatar14 from "@/assets/images/avtar14.png";
import avatar15 from "@/assets/images/avtar15.png";
import avatar16 from "@/assets/images/avtar16.png";
import avatar17 from "@/assets/images/avtar17.png";
import avatar18 from "@/assets/images/avtar18.png";
import avatar19 from "@/assets/images/avtar19.png";
import avatar20 from "@/assets/images/avtar20.png";

type StoredUser = {
  username?: string;
  email?: string;
  phone?: string;
  address?: string;
  avatarId?: string;
};

type AvatarOption = {
  id: string;
  image: StaticImageData;
};

type ProfileAction = {
  label: string;
  description: string;
  icon: string;
  href?: string;
  kind?: "logout";
};

const profileActions: ProfileAction[] = [
  {
    label: "Orders",
    description: "Track your past and upcoming orders",
    icon: "🧾",
    href: "/orders",
  },
  {
    label: "Favorites",
    description: "View your saved dishes",
    icon: "❤️",
    href: "/favorites",
  },
  {
    label: "Location",
    description: "Manage delivery addresses",
    icon: "📍",
    href: "#location",
  },
  {
    label: "Privacy Policy",
    description: "Review our commitments",
    icon: "🛡️",
    href: "/privacy",
  },
  {
    label: "Support",
    description: "Get help & FAQ",
    icon: "☎️",
    href: "#support",
  },
  {
    label: "Logout",
    description: "Sign out from Foodzo",
    icon: "🚪",
    kind: "logout",
  },
];

const avatarOptions: AvatarOption[] = [
  { id: "avatar-1", image: avatar1 },
  { id: "avatar-2", image: avatar2 },
  { id: "avatar-3", image: avatar3 },
  { id: "avatar-4", image: avatar4 },
  { id: "avatar-5", image: avatar5 },
  { id: "avatar-6", image: avatar6 },
  { id: "avatar-7", image: avatar7 },
  { id: "avatar-8", image: avatar8 },
  { id: "avatar-9", image: avatar9 },
  { id: "avatar-10", image: avatar10 },
  { id: "avatar-11", image: avatar11 },
  { id: "avatar-12", image: avatar12 },
  { id: "avatar-13", image: avatar13 },
  { id: "avatar-14", image: avatar14 },
  { id: "avatar-15", image: avatar15 },
  { id: "avatar-16", image: avatar16 },
  { id: "avatar-17", image: avatar17 },
  { id: "avatar-18", image: avatar18 },
  { id: "avatar-19", image: avatar19 },
  { id: "avatar-20", image: avatar20 },
];

const initialUser: StoredUser = {
  username: "Foodzo",
  email: "hello@foodzo.app",
  phone: "ID: 529867915",
  address: "Not provided",
};

const buildInitials = (name: string) => {
  const trimmed = name.trim();
  if (!trimmed) {
    return "FZ";
  }

  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .padEnd(2, "Z");
};

export default function ProfilePage() {
  const [user, setUser] = useState<StoredUser>(initialUser);
  const router = useRouter();
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(FOODZO_USER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredUser;
        setUser((previous) => ({ ...previous, ...parsed }));
        if (parsed.avatarId) {
          setSelectedAvatarId(parsed.avatarId);
        }
      }
    } catch (error) {
      console.warn("Failed to read stored user", error);
    }
  }, []);

  const handleLogout = useCallback(() => {
    try {
      window.localStorage.removeItem(FOODZO_USER_STORAGE_KEY);
    } catch (error) {
      console.warn("Failed to clear stored user", error);
    }

    setUser(initialUser);
    router.replace("/auth?mode=signin");
  }, [router]);

  const displayName = user.username?.trim() && user.username.trim().length > 0 ? user.username : "Foodzo";
  const displayEmail = user.email?.trim() && user.email.trim().length > 0 ? user.email : initialUser.email;
  const displayId = useMemo(() => {
    const phone = user.phone?.trim();
    if (!phone) {
      return initialUser.phone;
    }

    if (phone.startsWith("ID")) {
      return phone;
    }

    return `ID: ${phone}`;
  }, [user.phone]);

  const initials = useMemo(() => buildInitials(displayName), [displayName]);

  const openAvatarModal = () => setIsAvatarModalOpen(true);
  const closeAvatarModal = () => setIsAvatarModalOpen(false);

  const handleAvatarSelect = (id: string) => {
    setSelectedAvatarId(id);
  };

  const handleAvatarSave = () => {
    setUser((prev) => {
      const merged: StoredUser = {
        ...prev,
        avatarId: selectedAvatarId ?? undefined,
      };
      try {
        window.localStorage.setItem(FOODZO_USER_STORAGE_KEY, JSON.stringify(merged));
      } catch (error) {
        console.warn("Failed to persist avatar selection", error);
      }
      return merged;
    });
    closeAvatarModal();
  };

  const handleAvatarClear = () => {
    setSelectedAvatarId(null);
    setUser((prev) => {
      const { avatarId, ...rest } = prev;
      const merged = { ...rest } as StoredUser;
      try {
        window.localStorage.setItem(FOODZO_USER_STORAGE_KEY, JSON.stringify(merged));
      } catch (error) {
        console.warn("Failed to clear avatar selection", error);
      }
      return merged;
    });
  };

  const selectedAvatar = useMemo(() => {
    if (!selectedAvatarId) return null;
    return avatarOptions.find((option) => option.id === selectedAvatarId) ?? null;
  }, [selectedAvatarId]);

  return (
    <div className="flex min-h-dvh flex-col bg-white text-[#0f1c3f]">
      <header className="relative overflow-hidden rounded-b-[40px] bg-gradient-to-br from-[#ffcf4d] via-[#ff9f1f] to-[#ff7a00] px-6 pb-10 pt-9 text-white shadow-[0_24px_50px_rgba(255,153,0,0.3)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.4),transparent_55%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,218,151,0.28),transparent_60%)]"></div>

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/home"
              aria-label="Back to home"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-lg text-white shadow-[0_12px_24px_rgba(0,0,0,0.18)] backdrop-blur-sm transition hover:bg-white/30"
            >
              ←
            </Link>
            <h1 className="text-lg font-semibold">Profile</h1>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full bg-white/18 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white shadow-[0_12px_24px_rgba(0,0,0,0.18)] backdrop-blur-sm transition hover:bg-white/28"
          >
            <span className="text-base">🚪</span>
            Logout
          </button>
        </div>

        <div className="relative z-10 mt-8 flex flex-col items-center gap-3">
          <div className="relative">
            {selectedAvatar ? (
              <div className="h-24 w-24 overflow-hidden rounded-full shadow-[0_18px_36px_rgba(0,0,0,0.2)]">
                <Image
                  src={selectedAvatar.image}
                  alt={`${displayName} avatar`}
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-3xl font-semibold text-[#ff7a00] shadow-[0_18px_36px_rgba(0,0,0,0.2)]">
                {initials}
              </div>
            )}
            <button
              type="button"
              onClick={openAvatarModal}
              className="absolute -right-2 bottom-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ff7a00] text-white shadow-[0_12px_20px_rgba(0,0,0,0.2)] transition hover:scale-[1.05]"
              aria-label="Change avatar"
            >
              ✏️
            </button>
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold">{displayName}</p>
            <p className="text-sm font-medium text-white/80">{displayId}</p>
          </div>
          <div className="rounded-full bg-white/20 px-4 py-1 text-xs font-medium text-white/90 backdrop-blur">
            {displayEmail}
          </div>
        </div>
      </header>

      <main className="-mt-12 flex-1 rounded-t-[32px] bg-[#fff5e4] px-5 pb-28 pt-12">
        <section className="space-y-3">
          {profileActions.map((action) => (
            action.kind === "logout" ? (
              <button
                key={action.label}
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-between rounded-[22px] bg-[#f3f5ff] px-5 py-4 text-sm font-semibold text-[#253156] shadow-[0_20px_40px_rgba(101,136,255,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_26px_60px_rgba(101,136,255,0.18)]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg shadow-[0_12px_24px_rgba(101,136,255,0.15)]">
                    {action.icon}
                  </span>
                  <div className="flex flex-col">
                    <span>{action.label}</span>
                    <span className="text-xs font-medium text-[#6d7c9c]">{action.description}</span>
                  </div>
                </div>
                <span className="text-lg text-[#6d7c9c]">›</span>
              </button>
            ) : (
              <Link
                key={action.label}
                href={action.href ?? "#"}
                className="flex items-center justify-between rounded-[22px] bg-[#f3f5ff] px-5 py-4 text-sm font-semibold text-[#253156] shadow-[0_20px_40px_rgba(101,136,255,0.12)] transition hover:translate-x-1 hover:shadow-[0_26px_60px_rgba(101,136,255,0.18)]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg shadow-[0_12px_24px_rgba(101,136,255,0.15)]">
                    {action.icon}
                  </span>
                  <div className="flex flex-col">
                    <span>{action.label}</span>
                    <span className="text-xs font-medium text-[#6d7c9c]">{action.description}</span>
                  </div>
                </div>
                <span className="text-lg text-[#6d7c9c]">›</span>
              </Link>
            )
          ))}
        </section>
      </main>

      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 px-5 py-8 backdrop-blur-sm">
          <div className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-[0_26px_44px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
              <h2 className="text-lg font-semibold text-[#22120a]">Choose your avatar</h2>
              <button
                type="button"
                onClick={closeAvatarModal}
                className="rounded-full bg-[#ffe3c2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#8a4a12]"
              >
                Close
              </button>
            </div>
            <div className="grid max-h-[55vh] grid-cols-3 gap-3 overflow-y-auto px-6 py-5 sm:grid-cols-4">
              {avatarOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleAvatarSelect(option.id)}
                  className={`relative inline-flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-2 transition ${
                    selectedAvatarId === option.id
                      ? "border-[#ff7a00] shadow-[0_18px_28px_rgba(255,122,0,0.35)]"
                      : "border-transparent shadow-[0_12px_22px_rgba(0,0,0,0.12)]"
                  }`}
                >
                  <Image
                    src={option.image}
                    alt={`Avatar ${option.id.split("-")[1]}`}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                  {selectedAvatarId === option.id && (
                    <span className="absolute inset-x-0 bottom-1 mx-auto w-[70%] rounded-full bg-white/85 py-1 text-xs font-semibold text-[#ff7a00]">
                      Selected
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-black/10 bg-[#fff8ef] px-6 py-4">
              <button
                type="button"
                onClick={handleAvatarClear}
                className="rounded-full bg-[#ffe3c2] px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-[#8a4a12]"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={handleAvatarSave}
                className="rounded-full bg-[#ff7a00] px-5 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-white shadow-[0_18px_32px_rgba(255,122,0,0.35)]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
