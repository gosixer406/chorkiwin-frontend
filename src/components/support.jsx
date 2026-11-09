import Loader from "@/components/loader";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpen,
  ChevronRight,
  ExternalLink,
  Globe,
  House,
  MessageSquareText,
  Mic,
  Paperclip,
  Users,
  X,
} from "lucide-react";
import { useSelector } from "react-redux";
import { api } from "@/lib/api";
import GameHall from "@/components/game-hall";
import brandLogo from "@/assets/img/logo/short_logo_3d.png";
import SpinWheel from "@/components/spin-wheel";
import launcherGif from "@/assets/img/new/three-logo-animation-images.gif";
import luckySpinWheel from "@/assets/img/lucky-spin-wheel.svg";

function getGuestToken() {
  const key = "velki_support_guest";
  let value = localStorage.getItem(key);
  if (!value) {
    // crypto.randomUUID only exists in secure contexts (https/localhost),
    // so opening the dev server via a LAN IP would otherwise crash here.
    value = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
    localStorage.setItem(key, value);
  }
  return value;
}

// Shared drag behaviour for the floating buttons: drag anywhere inside the app column, tap to open.
function useFloatingDrag(onOpen) {
  const buttonRef = useRef(null);
  const dragRef = useRef(null);
  const [position, setPosition] = useState(null);
  const [dragging, setDragging] = useState(false);

  const clampPosition = useCallback((clientX, clientY, offsetX, offsetY) => {
    const size = buttonRef.current?.offsetWidth || 64;
    const appWidth = Math.min(window.innerWidth, 430);
    const appLeft = Math.max(0, (window.innerWidth - appWidth) / 2);
    return {
      x: Math.max(
        appLeft,
        Math.min(clientX - offsetX, appLeft + appWidth - size),
      ),
      y: Math.max(52, Math.min(clientY - offsetY, window.innerHeight - size)),
    };
  }, []);

  useEffect(() => {
    if (!position) return undefined;
    const keepInView = () => {
      const size = buttonRef.current?.offsetWidth || 64;
      const appWidth = Math.min(window.innerWidth, 430);
      const appLeft = Math.max(0, (window.innerWidth - appWidth) / 2);
      setPosition(
        (current) =>
          current && {
            x: Math.max(
              appLeft,
              Math.min(current.x, appLeft + appWidth - size),
            ),
            y: Math.max(52, Math.min(current.y, window.innerHeight - size)),
          },
      );
    };
    window.addEventListener("resize", keepInView);
    return () => window.removeEventListener("resize", keepInView);
  }, [position]);

  useEffect(() => {
    if (!dragging) return undefined;

    const move = (event) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      if (
        Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 5
      )
        drag.moved = true;
      if (!drag.moved) return;
      event.preventDefault();
      setPosition(
        clampPosition(event.clientX, event.clientY, drag.offsetX, drag.offsetY),
      );
    };

    const finish = (event) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      dragRef.current = null;
      setDragging(false);
      if (!drag.moved) onOpen();
    };

    const cancel = () => {
      dragRef.current = null;
      setDragging(false);
    };

    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", cancel);
    };
  }, [clampPosition, dragging, onOpen]);

  const startDrag = (event) => {
    if (!buttonRef.current) return;
    const bounds = buttonRef.current.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
      moved: false,
    };
    setDragging(true);
  };

  return { buttonRef, position, dragging, startDrag };
}

const LAUNCHER_RADIUS = 92;

// Red count bubble, e.g. spins waiting to be played.
function CountBadge({ count }) {
  if (!count) return null;
  return (
    <span className="pointer-events-none absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full border-2 border-[var(--c-page)] bg-[#F2545B] px-1 font-poppins text-[11px] font-bold leading-none text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

// One draggable launcher; tapping it fans the spin and games buttons out in two directions.
function FloatingLauncher({ hidden, actions }) {
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded((value) => !value), []);
  const { buttonRef, position, dragging, startDrag } = useFloatingDrag(toggle);

  useEffect(() => {
    if (!expanded) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  if (hidden) return null;

  // Fan away from the nearest screen edges so every button stays on screen.
  const fanRight = position ? position.x + 32 < window.innerWidth / 2 : false;
  const fanDown = position ? position.y < 220 : false;
  const dx = fanRight ? 1 : -1;
  const dy = fanDown ? 1 : -1;
  const offsets = [
    [0, dy * LAUNCHER_RADIUS],
    [dx * LAUNCHER_RADIUS, 0],
  ];

  return (
    <>
      {expanded && (
        <div
          className="fixed inset-0 z-[21470] bg-black/40 backdrop-blur-[1px]"
          onClick={() => setExpanded(false)}
          aria-hidden="true"
        />
      )}
      <div
        ref={buttonRef}
        className="fixed z-[21471] size-16 md:size-20"
        style={
          position
            ? { left: `${position.x}px`, top: `${position.y}px` }
            : {
                right: "max(12px, calc((100vw - 430px) / 2 + 12px))",
                bottom: "92px",
              }
        }
      >
        {actions.map((action, index) => {
          const [x, y] = offsets[index];
          return (
            <button
              key={action.label}
              type="button"
              aria-label={action.label}
              tabIndex={expanded ? 0 : -1}
              onClick={() => {
                setExpanded(false);
                action.onClick();
              }}
              className="absolute left-1/2 top-1/2 transition-all duration-300 ease-out"
              style={{
                transform: expanded
                  ? `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1)`
                  : "translate(-50%, -50%) scale(0.3)",
                opacity: expanded ? 1 : 0,
                pointerEvents: expanded ? "auto" : "none",
                transitionDelay: expanded ? `${index * 50}ms` : "0ms",
              }}
            >
              <span className="grid size-13 place-items-center overflow-hidden rounded-full border-2 border-[var(--c-gold)] bg-[var(--c-surface)] text-[var(--c-gold)] shadow-lg">
                {action.icon}
              </span>
              <CountBadge count={action.badge} />
            </button>
          );
        })}
        <button
          type="button"
          aria-label={expanded ? "Close menu" : "Open menu"}
          aria-expanded={expanded}
          className={`relative size-full select-none rounded-full shadow-lg transition-transform ${expanded ? "scale-90" : ""} ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
          style={{ touchAction: "none" }}
          onPointerDown={startDrag}
          onDragStart={(event) => event.preventDefault()}
          // Pointer taps toggle from pointerup; this keeps keyboard activation working.
          onClick={(event) => {
            if (event.detail === 0) toggle();
          }}
        >
          <img
            className="pointer-events-none size-full rounded-full object-cover"
            src={launcherGif}
            alt=""
            draggable="false"
          />
          {expanded && (
            <span className="absolute inset-0 grid place-items-center rounded-full bg-black/45 text-white">
              <X className="size-7" strokeWidth={2.5} />
            </span>
          )}
          {!expanded && (
            <CountBadge
              count={actions.reduce((sum, action) => sum + (action.badge || 0), 0)}
            />
          )}
        </button>
      </div>
    </>
  );
}

// Support panel branding. Leave a value empty ('') until the real asset or link is ready.
const SUPPORT_BRAND_NAME = "Chorkiwala";
const SUPPORT_BRAND_LOGO = brandLogo;
const SUPPORT_POWERED_BY = "";
const SUPPORT_TEAM = [
  { name: "Devid", bg: "#D6EFE0", fg: "#2F6B48" },
  { name: "John", bg: "#F6DFC4", fg: "#8A5A2B" },
  { name: "Maya", bg: "#E2DEF3", fg: "#56508A" },
  { name: "Neon", bg: "#D9EAF5", fg: "#3D6687" },
];

function FacebookLogo({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z" />
    </svg>
  );
}

function MessengerLogo({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 0C5.24 0 0 4.95 0 11.64c0 3.5 1.43 6.52 3.77 8.61.2.18.31.42.32.68l.07 2.13a.96.96 0 0 0 1.35.85l2.38-1.05c.2-.09.43-.1.64-.05 1.09.3 2.26.46 3.47.46 6.76 0 12-4.95 12-11.64S18.76 0 12 0Zm7.2 8.96-3.52 5.59a1.8 1.8 0 0 1-2.6.48l-2.8-2.1a.72.72 0 0 0-.87 0l-3.78 2.87c-.5.38-1.16-.22-.83-.76l3.52-5.59a1.8 1.8 0 0 1 2.6-.48l2.8 2.1c.26.2.61.2.87 0l3.78-2.87c.5-.38 1.16.22.83.76Z" />
    </svg>
  );
}

function WhatsappLogo({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35ZM12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88a9.83 9.83 0 0 1 9.88 9.89c0 5.45-4.44 9.88-9.89 9.88Zm8.41-18.3A11.81 11.81 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.94L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.17-1.24-6.16-3.48-8.4Z" />
    </svg>
  );
}

// Social links under the support team. Fill in each url; an empty url keeps the row visible but inactive.
const SUPPORT_SOCIALS = [
  {
    label: "Chorkiwala Facebook Page",
    sub: "আমাদের পেজ ফলো করুন",
    url: "",
    Logo: FacebookLogo,
    color: "#1877F2",
  },
  {
    label: "Chorkiwala Facebook Group",
    sub: "গ্রুপে জয়েন করুন",
    url: "",
    Logo: Users,
    color: "#1877F2",
  },
  {
    label: "Facebook Messenger",
    sub: "মেসেঞ্জারে মেসেজ দিন",
    url: "",
    Logo: MessengerLogo,
    color: "#A033FF",
  },
  {
    label: "WhatsApp",
    sub: "হোয়াটসঅ্যাপে কথা বলুন",
    url: "",
    Logo: WhatsappLogo,
    color: "#25D366",
  },
];

// Backup site addresses shown under the social links. Fill in each url.
const SUPPORT_PROXY_LINKS = [
  { label: "Proxy Link 1", url: "" },
  { label: "Proxy Link 2", url: "" },
  { label: "Proxy Link 3", url: "" },
];
// Panel colours come from the site palette in index.css, so Light/Dark follow the site theme.
const t = {
  bg: "var(--c-page)",
  header: "var(--c-bar)",
  surface: "var(--c-surface)",
  border: "var(--c-line-strong)",
  pill: "var(--c-surface-2)",
  text: "var(--c-ink)",
  muted: "var(--c-ink-muted)",
  hero: "var(--c-surface-2)",
  accent: "var(--c-gold)",
  onAccent: "var(--c-on-gold)",
};

function initials(name) {
  const parts = name.trim().split(/\s+/);
  return (
    parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0]
  ).toUpperCase();
}

function TeamAvatar({ member, className = "size-11 text-[15px]" }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-semibold ${className}`}
      style={{ backgroundColor: member.bg, color: member.fg }}
      aria-hidden="true"
    >
      {initials(member.name)}
    </span>
  );
}

function AvatarStack({
  size = "size-11 text-[14px]",
  overlap = "-ml-2",
  ring,
}) {
  return (
    <div className="flex items-center">
      {SUPPORT_TEAM.slice(0, 3).map((member, index) => (
        <span
          key={member.name}
          className={`rounded-full border-2 ${index ? overlap : ""}`}
          style={{ borderColor: ring }}
        >
          <TeamAvatar member={member} className={size} />
        </span>
      ))}
    </div>
  );
}

function BottomBar({ view, onChange }) {
  return (
    <div
      className="shrink-0 pb-[env(safe-area-inset-bottom)]"
      style={{ backgroundColor: t.header }}
    >
      <nav
        className="grid grid-cols-2 gap-2 border-t px-4 py-2"
        style={{ borderColor: t.border }}
        aria-label="Support navigation"
      >
        {[
          ["home", "হোম", House],
          ["messages", "মেসেজ", MessageSquareText],
        ].map(([value, label, Icon]) => {
          const active = view === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange(value)}
              className="flex h-[52px] flex-col items-center justify-center gap-1 rounded-xl text-[13px]"
              style={{
                backgroundColor: active ? t.pill : "transparent",
                color: active ? t.text : t.muted,
              }}
            >
              <Icon className="size-[22px]" strokeWidth={1.7} />
              {label}
            </button>
          );
        })}
      </nav>
      {SUPPORT_POWERED_BY && (
        <p
          className="py-2 text-center text-[11px]"
          style={{ backgroundColor: t.bg, color: t.muted }}
        >
          Powered by{" "}
          <span className="font-medium" style={{ color: t.text }}>
            {SUPPORT_POWERED_BY}
          </span>
        </p>
      )}
    </div>
  );
}

function SupportPanel({
  conversation,
  loading,
  error,
  body,
  setBody,
  onSend,
  onClose,
  bottomRef,
}) {
  const username = useSelector((state) => state.auth.user?.username) || "";
  const [view, setView] = useState("home");
  const messages = conversation?.messages || [];
  const awaitingAgent = conversation?.status === "awaiting_agent";
  const closed = conversation?.status === "closed";

  const submit = (event) => {
    event.preventDefault();
    onSend();
  };

  const card = { backgroundColor: t.surface, borderColor: t.border };
  const bar = <BottomBar view={view} onChange={setView} />;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Customer support"
      className="fixed inset-y-0 left-1/2 z-50 flex w-full max-w-[430px] -translate-x-1/2 flex-col font-inter"
      style={{ backgroundColor: t.bg, color: t.text, colorScheme: "dark" }}
    >
      {view === "home" && (
        <>
          <div
            className="min-h-0 flex-1 overflow-y-auto"
            style={{
              backgroundImage: `linear-gradient(180deg, ${t.hero} 0px, ${t.hero} 200px, ${t.bg} 380px)`,
            }}
          >
            <div className="flex items-center justify-between px-6 pt-6">
              {SUPPORT_BRAND_LOGO ? (
                <img
                  src={SUPPORT_BRAND_LOGO}
                  alt={SUPPORT_BRAND_NAME}
                  className="h-12 max-w-[120px] object-contain"
                />
              ) : (
                <span className="font-poppins text-[17px] font-extrabold tracking-tight text-white">
                  {SUPPORT_BRAND_NAME}
                </span>
              )}
              <div className="flex items-center gap-5">
                <AvatarStack
                  size="size-[38px] text-[13px]"
                  overlap="-ml-2"
                  ring={t.hero}
                />
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close support"
                  className="text-white"
                >
                  <X className="size-6" strokeWidth={2} />
                </button>
              </div>
            </div>
            <div className="px-6 pb-7 pt-10 text-white">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 py-1.5 pl-2.5 pr-4 text-[13px] font-medium text-white/90 backdrop-blur-sm">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
                </span>
                <span>
                  <span className="font-semibold" style={{ color: t.accent }}>
                    Chorkiwala
                  </span>{" "}
                  লাইভ চ্যাটে আপনাকে স্বাগতম
                </span>
              </p>
              <h2 className="text-[34px] font-bold leading-[1.25] text-white">
                হাই {username} 👋
                <br />
                আমরা কীভাবে সাহায্য করতে পারি?
              </h2>
              <p className="mt-3 text-[15px] text-white/75">
                যখনই দরকার, আমরা পাশে আছি।
              </p>
            </div>

            <div className="flex flex-col gap-4 px-6 pb-6">
              <button
                type="button"
                onClick={() => setView("chat")}
                className="flex items-center justify-between gap-3 rounded-2xl border px-6 py-5 text-left transition-colors"
                style={card}
              >
                <span className="min-w-0">
                  <span className="block text-[17px] font-semibold">
                    আমাদের একটি মেসেজ পাঠান
                  </span>
                  <span
                    className="mt-0.5 block text-[14px]"
                    style={{ color: t.muted }}
                  >
                    আমাদের সাপোর্ট টিমের সাহায্য নিন
                  </span>
                </span>
                <span
                  className="grid size-11 shrink-0 place-items-center rounded-full"
                  style={{ backgroundColor: t.accent, color: t.onAccent }}
                >
                  <ArrowRight className="size-5" />
                </span>
              </button>

              <div className="overflow-hidden rounded-2xl border" style={card}>
                <p className="flex items-center gap-3 px-6 pb-3 pt-5 text-[16px] font-semibold">
                  <BookOpen
                    className="size-5"
                    strokeWidth={1.6}
                    style={{ color: t.muted }}
                  />
                  সহজেই সমাধান খুঁজুন
                </p>
                {["স্ক্রিনশট শেয়ার করুন", "ভয়েস মেসেজ পাঠান"].map(
                  (label, index) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setView("chat")}
                      className={`flex w-full items-center justify-between px-6 py-4 text-left text-[16px] ${index ? "border-t" : ""}`}
                      style={{ borderColor: t.border }}
                    >
                      {label}
                      <ChevronRight
                        className="size-5"
                        style={{ color: t.muted }}
                      />
                    </button>
                  ),
                )}
              </div>

              <div className="rounded-2xl border px-6 py-5" style={card}>
                <div className="flex items-center justify-between">
                  <p className="text-[16px] font-semibold">আপনার সাপোর্ট টিম</p>
                  <span
                    className="grid size-7 place-items-center rounded-full text-[13px]"
                    style={{ backgroundColor: t.pill, color: t.muted }}
                  >
                    {SUPPORT_TEAM.length}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4">
                  {SUPPORT_TEAM.map((member) => (
                    <div
                      key={member.name}
                      className="flex min-w-0 items-center gap-3"
                    >
                      <TeamAvatar member={member} />
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] font-semibold">
                          {member.name}
                        </span>
                        <span
                          className="block text-[12px]"
                          style={{ color: t.muted }}
                        >
                          Support team
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border" style={card}>
                <p className="px-6 pb-3 pt-5 text-[16px] font-semibold">
                  আমাদের সাথে যুক্ত থাকুন
                </p>
                {SUPPORT_SOCIALS.map(({ label, sub, url, Logo, color }) => (
                  <a
                    key={label}
                    href={url || undefined}
                    target="_blank"
                    rel="noreferrer"
                    aria-disabled={!url}
                    onClick={(event) => {
                      if (!url) event.preventDefault();
                    }}
                    className="flex items-center gap-4 border-t px-6 py-3.5"
                    style={{ borderColor: t.border }}
                  >
                    <span
                      className="grid size-10 shrink-0 place-items-center rounded-xl text-white"
                      style={{ backgroundColor: color }}
                    >
                      <Logo className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold">
                        {label}
                      </span>
                      <span
                        className="block text-[12px]"
                        style={{ color: t.muted }}
                      >
                        {sub}
                      </span>
                    </span>
                    <ExternalLink
                      className="size-4 shrink-0"
                      style={{ color: t.muted }}
                    />
                  </a>
                ))}
              </div>

              <div className="overflow-hidden rounded-2xl border" style={card}>
                <p className="flex items-center gap-3 px-6 pb-3 pt-5 text-[16px] font-semibold">
                  <Globe
                    className="size-5"
                    strokeWidth={1.6}
                    style={{ color: t.muted }}
                  />
                  প্রক্সি লিংক
                </p>
                {SUPPORT_PROXY_LINKS.map(({ label, url }, index) => (
                  <a
                    key={label}
                    href={url || undefined}
                    target="_blank"
                    rel="noreferrer"
                    aria-disabled={!url}
                    onClick={(event) => {
                      if (!url) event.preventDefault();
                    }}
                    className="flex items-center gap-4 border-t px-6 py-3.5"
                    style={{ borderColor: t.border }}
                  >
                    <span
                      className="grid size-10 shrink-0 place-items-center rounded-xl text-[15px] font-bold"
                      style={{ backgroundColor: t.accent, color: t.onAccent }}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold">
                        {label}
                      </span>
                      <span
                        className="block truncate text-[12px]"
                        style={{ color: t.muted }}
                      >
                        {url ? url.replace(/^https?:\/\//, "") : "শীঘ্রই আসছে"}
                      </span>
                    </span>
                    <ExternalLink
                      className="size-4 shrink-0"
                      style={{ color: t.muted }}
                    />
                  </a>
                ))}
              </div>

              <p
                className="pt-2 text-center text-[14px]"
                style={{ color: t.muted }}
              >
                একটু কথা। একটু সাহায্য।
              </p>
            </div>
          </div>
          {bar}
        </>
      )}

      {view === "messages" && (
        <>
          <header
            className="flex h-[72px] shrink-0 items-center gap-4 border-b px-5"
            style={{ backgroundColor: t.header, borderColor: t.border }}
          >
            <button
              type="button"
              onClick={() => setView("home")}
              aria-label="Back"
              className="grid size-8 place-items-center"
            >
              <ArrowLeft className="size-5" />
            </button>
            <h2
              className="flex-1 text-[18px] font-semibold"
              style={{ color: t.text }}
            >
              মেসেজ
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close support"
              className="grid size-8 place-items-center"
            >
              <X className="size-5" />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-8">
            <p
              className="text-[12px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: t.muted }}
            >
              Keep the conversation going
            </p>
            <h3
              className="mt-3 text-[30px] font-bold leading-tight"
              style={{ color: t.text }}
            >
              Your messages
            </h3>
            <p className="mt-2 text-[15px]" style={{ color: t.muted }}>
              Pick up where you left off, or start something new.
            </p>

            {messages.length > 0 ? (
              <button
                type="button"
                onClick={() => setView("chat")}
                className="mt-8 flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left"
                style={card}
              >
                <AvatarStack
                  size="size-8 text-[11px]"
                  overlap="-ml-3"
                  ring={t.surface}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">
                    {messages[messages.length - 1].body}
                  </span>
                  <span
                    className="block text-[12px]"
                    style={{ color: t.muted }}
                  >
                    {SUPPORT_BRAND_NAME}
                  </span>
                </span>
                <ChevronRight className="size-5" style={{ color: t.muted }} />
              </button>
            ) : (
              <div className="flex flex-col items-center px-2 pt-24 text-center">
                <span
                  className="grid size-[84px] place-items-center rounded-3xl"
                  style={{ backgroundColor: t.pill }}
                >
                  <MessageSquareText className="size-7" strokeWidth={1.6} />
                </span>
                <p className="mt-6 text-[19px] font-semibold">
                  Your conversations live here
                </p>
                <p
                  className="mt-2 text-[15px] leading-relaxed"
                  style={{ color: t.muted }}
                >
                  Start a conversation and return here whenever you need us.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setView("chat")}
              className="mt-10 flex h-[66px] w-full items-center justify-between rounded-2xl px-6 text-[16px] font-semibold"
              style={{ backgroundColor: t.surface }}
            >
              {messages.length > 0
                ? "Continue the conversation"
                : "Start a conversation"}
              <ArrowRight className="size-5" />
            </button>
          </div>
          {bar}
        </>
      )}

      {view === "chat" && (
        <>
          <header
            className="flex h-[72px] shrink-0 items-center gap-3 border-b px-4"
            style={{ backgroundColor: t.header, borderColor: t.border }}
          >
            <button
              type="button"
              onClick={() => setView("home")}
              aria-label="Back"
              className="grid size-8 place-items-center"
            >
              <ArrowLeft className="size-5" />
            </button>
            <AvatarStack
              size="size-[30px] text-[11px]"
              overlap="-ml-2"
              ring={t.header}
            />
            <span className="min-w-0 flex-1 truncate text-[16px] font-semibold">
              {SUPPORT_BRAND_NAME}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close support"
              className="grid size-8 place-items-center"
            >
              <X className="size-5" />
            </button>
          </header>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-5">
            {loading && !conversation && (
              <Loader label="লোড হচ্ছে…" />
            )}
            {error && (
              <div
                role="alert"
                className="rounded-lg bg-red-500/10 p-3 text-[13px] text-red-500"
              >
                {error}
              </div>
            )}
            {messages.map((message) => {
              const mine = message.sender_type === "customer";
              return (
                <div
                  key={message.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className="max-w-[80%] whitespace-pre-line rounded-[20px] px-4 py-2.5 text-[14px]"
                    style={
                      mine
                        ? { backgroundColor: t.accent, color: t.onAccent }
                        : {
                            backgroundColor: t.surface,
                            color: t.text,
                            border: `1px solid ${t.border}`,
                          }
                    }
                  >
                    <p>{message.body}</p>
                    {message.details?.quick_replies?.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {message.details.quick_replies.map((reply) => (
                          <button
                            key={reply.topic}
                            type="button"
                            disabled={loading}
                            onClick={() => onSend(reply.label, reply.topic)}
                            className="rounded-full border px-3 py-1 text-[12px]"
                            style={{
                              borderColor: t.border,
                              backgroundColor: t.bg,
                              color: t.text,
                            }}
                          >
                            {reply.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {awaitingAgent && (
            <div
              className="flex shrink-0 items-center justify-center gap-2 pb-3 text-[13px]"
              style={{ color: t.muted }}
            >
              <AvatarStack
                size="size-[20px] text-[8px]"
                overlap="-ml-1.5"
                ring={t.bg}
              />
              একজন টিমমেটের জন্য অপেক্ষা করা হচ্ছে
            </div>
          )}

          <form
            onSubmit={submit}
            className="mx-4 mb-[max(12px,env(safe-area-inset-bottom))] shrink-0 rounded-2xl border px-4 pb-2.5 pt-3"
            style={card}
          >
            <input
              disabled={!conversation || closed}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="মেসেজ..."
              aria-label="Message"
              className="w-full bg-transparent text-[15px] outline-none"
              style={{ color: t.text }}
            />
            <div className="mt-3 flex items-center justify-between">
              <div
                className="flex items-center gap-3"
                style={{ color: t.muted }}
                aria-hidden="true"
              >
                <Paperclip className="size-[18px]" />
                <Mic className="size-[18px]" />
              </div>
              <button
                disabled={loading || !body.trim() || !conversation || closed}
                aria-label="Send message"
                className="grid size-[32px] place-items-center rounded-full transition-opacity disabled:opacity-40"
                style={{ backgroundColor: t.accent, color: t.onAccent }}
              >
                <ArrowUp className="size-4" strokeWidth={2.5} />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

export default function Support() {
  const [open, setOpen] = useState(false);
  const [hallOpen, setHallOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const guestToken = useMemo(() => getGuestToken(), []);
  const headers = useMemo(
    () => ({ "X-Support-Guest": guestToken }),
    [guestToken],
  );

  useEffect(() => {
    if (!open || conversation) return;
    let active = true;
    Promise.resolve().then(() => active && setLoading(true));
    api
      .get("/api/support/conversations/current", { headers })
      .then(
        async (response) =>
          response.data ||
          (
            await api.post(
              "/api/support/conversations",
              { guest_token: guestToken, subject: "Customer Support" },
              { headers },
            )
          ).data,
      )
      .then((data) => active && setConversation(data))
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [conversation, guestToken, headers, open]);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener("velki:open-support", show);
    return () => window.removeEventListener("velki:open-support", show);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages?.length]);

  async function send(message = body, topic = "") {
    if (!conversation || !message.trim()) return;
    setLoading(true);
    setError("");
    try {
      const response = await api.post(
        `/api/support/conversations/${conversation.id}/messages`,
        { guest_token: guestToken, body: message.trim(), topic },
        { headers },
      );
      setConversation(response.data);
      setBody("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  const [spinCount, setSpinCount] = useState(0);

  const launcherActions = [
    {
      label: "Spin",
      badge: spinCount,
      onClick: () => window.dispatchEvent(new CustomEvent("velki:open-spin")),
      icon: (
        <img src={luckySpinWheel} alt="" className="size-full object-contain" />
      ),
    },
    {
      label: "Games",
      onClick: () => setHallOpen(true),
      icon: <img src="/game.svg" alt="" className="size-full object-contain" />,
    },
  ];

  return (
    <>
      <FloatingLauncher hidden={hallOpen} actions={launcherActions} />
      <SpinWheel onCountChange={setSpinCount} />
      <GameHall open={hallOpen} onClose={() => setHallOpen(false)} />
      {open && (
        <SupportPanel
          conversation={conversation}
          loading={loading}
          error={error}
          body={body}
          setBody={setBody}
          onSend={send}
          onClose={() => setOpen(false)}
          bottomRef={bottomRef}
        />
      )}
    </>
  );
}
