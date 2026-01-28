"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import deliveryMan from "@/assets/images/deleveryman.png";

export default function Home() {
  const chipRef = useRef<HTMLDivElement>(null);
  const heroFigureRef = useRef<HTMLDivElement>(null);
  const [chipVisible, setChipVisible] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const updateVisibility = () => {
      const chipEl = chipRef.current;
      if (!chipEl) return;

      const viewportTop = window.visualViewport?.offsetTop ?? 0;
      const spaceAbove = chipEl.getBoundingClientRect().top - viewportTop;
      const hasRoom = spaceAbove >= 8;

      setChipVisible((prev) => (prev === hasRoom ? prev : hasRoom));
    };

    updateVisibility();

    window.addEventListener("resize", updateVisibility);
    window.addEventListener("scroll", updateVisibility, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && heroFigureRef.current) {
      resizeObserver = new ResizeObserver(updateVisibility);
      resizeObserver.observe(heroFigureRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateVisibility);
      window.removeEventListener("scroll", updateVisibility);
      resizeObserver?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isSheetOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSheetOpen(false);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSheetOpen]);

  const openSheet = () => setIsSheetOpen(true);
  const closeSheet = () => setIsSheetOpen(false);
  const handleSheetNavigate = (mode: "signin" | "signup") => {
    setIsSheetOpen(false);
    router.push(`/auth?mode=${mode}`);
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white text-[#303030]">
      <section className="relative flex h-[58%] min-h-[320px] flex-col items-center justify-end overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#ffcf4d] via-[#ffb027] to-[#ff7a00]"></div>
        <div className="absolute inset-x-[-15%] bottom-[-32%] z-10 h-[60%] rounded-t-[55%] bg-white"></div>

        <div className="relative z-20 flex w-full flex-col items-center justify-end pb-10 pt-[clamp(7rem,12vw,9.5rem)]">
          <div
            ref={heroFigureRef}
            className="animate-scale-in animate-delay-150 relative flex items-end justify-center"
            style={{
              height: "clamp(320px, 80vw, 560px)",
              width: "clamp(280px, 98vw, 920px)",
            }}
          >
            <div
              ref={chipRef}
              className="pointer-events-none animate-fade-down animate-delay-0 absolute left-1/2 flex -translate-x-1/2 justify-center"
              style={{
                bottom: "calc(100% + 10px)",
                opacity: chipVisible ? 1 : 0,
                visibility: chipVisible ? "visible" : "hidden",
              }}
            >
              <span className="chip-shine animate-chip-glow inline-flex items-center justify-center rounded-full bg-white/90 px-[clamp(1.75rem,4.8vw,2.4rem)] py-[clamp(0.55rem,1.6vw,0.75rem)] text-[clamp(10px,2.2vw,13px)] font-semibold uppercase tracking-[0.35em] text-black">
                Foodzo
              </span>
            </div>
            <div
              className="absolute rounded-full bg-[#ffd8b5]/70 blur-3xl"
              style={{
                bottom: "clamp(20px, 3.5vw, 36px)",
                height: "clamp(220px, 42vw, 350px)",
                width: "clamp(220px, 42vw, 350px)",
              }}
            ></div>
            <Image
              src={deliveryMan}
              alt="Courier delivering pizza on scooter"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </section>

      <section className="flex h-[42%] w-full flex-col items-center justify-center gap-4 px-5 pb-8 text-center">
        <h1
          className="animate-fade-up animate-delay-200 flex max-w-[min(92vw,420px)] flex-col gap-[2px] px-1 text-center font-bold"
          style={{
            fontSize: "clamp(22px, 6.4vw, 44px)",
            lineHeight: "clamp(28px, 7.2vw, 52px)",
          }}
        >
          <span className="text-gradient-amber">
            Fastest <span className="text-[#2b2b2b]">Online</span>
          </span>
          <span className="text-[#2b2b2b]">
            Food <span className="text-gradient-amber">Delivery</span> Service
          </span>
        </h1>

        <p
          className="animate-fade-up animate-delay-300 max-w-[min(90vw,340px)] text-center leading-relaxed text-[#6b6b6b]"
          style={{
            fontSize: "clamp(13px, 3.9vw, 17px)",
            lineHeight: "clamp(20px, 5.2vw, 26px)",
          }}
        >
          We are most fastest and favourite food delivery service all over the
          world. Search for your favourite food or restaurant in your area.
        </p>

        <button
          type="button"
          onClick={openSheet}
          className="animate-fade-up animate-delay-400 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#d48a00] via-[#f2a100] to-[#ffb526] px-[clamp(2.6rem,8.8vw,4.3rem)] py-[clamp(0.75rem,2.4vw,1rem)] text-[clamp(14px,3.4vw,17px)] font-semibold text-[#2b2108] shadow-[0_18px_38px_rgba(242,161,0,0.35)] transition-transform duration-200 hover:scale-[1.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c27b00]"
        >
          Get Started
        </button>

        <div className="animate-fade-up animate-delay-500 animate-bar-glow h-2.5 w-[clamp(72px,18vw,108px)] rounded-full bg-gradient-to-r from-[#d48a00] via-[#f7b232] to-[#ffe080] shadow-[0_6px_18px_rgba(242,161,0,0.28)]"></div>
      </section>

      {isSheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-sheet-title"
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/45 backdrop-blur-[2px] animate-sheet-fade"
          onClick={closeSheet}
        >
          <div className="pointer-events-none w-full max-w-[440px] px-5 pb-8">
            <div
              className="pointer-events-auto relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#ffcf4d] via-[#ffb027] to-[#ff7a00] p-[clamp(2rem,5.5vw,2.6rem)] text-left text-[#1f1405] shadow-[0_28px_70px_rgba(255,110,0,0.38)] animate-sheet-rise"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="absolute right-[clamp(1rem,3vw,1.35rem)] top-[clamp(1rem,3vw,1.35rem)] flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-[#2b2b2b] shadow-[0_12px_24px_rgba(255,255,255,0.35)] transition hover:scale-[1.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2b2b2b]/60"
                aria-label="Close welcome options"
                onClick={closeSheet}
              >
                <span className="text-lg leading-none">×</span>
              </button>

              <div className="flex flex-col gap-3 pr-10">
                <h2
                  id="welcome-sheet-title"
                  className="text-[clamp(24px,6vw,30px)] font-bold leading-tight"
                >
                  Welcome
                </h2>
                <p className="text-[clamp(13px,3.4vw,16px)] leading-relaxed text-[#3c2a12]">
                  Reach your favourite restaurants and dishes faster than ever. Choose an option to continue.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="min-w-[120px] flex-1 rounded-full bg-[#111]/95 px-6 py-3 text-[clamp(13px,3.4vw,16px)] font-semibold text-white shadow-[0_16px_32px_rgba(0,0,0,0.28)] transition hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-black"
                  onClick={() => handleSheetNavigate("signin")}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className="min-w-[120px] flex-1 rounded-full bg-white/95 px-6 py-3 text-[clamp(13px,3.4vw,16px)] font-semibold text-[#1d1d1d] shadow-[0_16px_32px_rgba(255,255,255,0.4)] transition hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white"
                  onClick={() => handleSheetNavigate("signup")}
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
