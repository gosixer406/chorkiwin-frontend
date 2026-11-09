import { useState } from "react";
import { BadgeCheck, ChevronDown } from "lucide-react";
import { useUplineAgent, whatsappLink } from "@/lib/upline-agent";
import whatsapp_icon from "@/assets/img/new/whastapp-icon.jpeg";

export function VerifiedBadge({ className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 font-inter text-[11px] font-semibold text-green-500 ${className}`}
    >
      chorkix.com Verified
      <BadgeCheck className="size-3.5" strokeWidth={2} />
    </span>
  );
}

// Scalloped seal outline (viewBox 0 0 100 100): rounded bumps between r=44 and r=50.
const SEAL_BUMPS = 24;
const SEAL_PATH = (() => {
  const point = (r, angle) =>
    `${(50 + r * Math.cos(angle)).toFixed(2)} ${(50 + r * Math.sin(angle)).toFixed(2)}`;
  const step = (Math.PI * 2) / SEAL_BUMPS;
  let d = `M${point(44, 0)}`;
  for (let i = 0; i < SEAL_BUMPS; i++) {
    d += ` Q${point(53, (i + 0.5) * step)} ${point(44, (i + 1) * step)}`;
  }
  return `${d}Z`;
})();

/**
 * Upline / agent details for logged-in players: a section bar like the menu's
 * "Games" heading that drops down a step-banner card with the agent ID,
 * a Verified tab and the agent's WhatsApp number.
 */
export default function UplineAgentCard({ className = "" }) {
  const [open, setOpen] = useState(false);
  const agent = useUplineAgent();

  // Hidden unless the player's upline agent is online on the Agent List.
  if (agent.loading || !agent.isOnline) return null;

  return (
    <section className={className} aria-label="Upline agent details">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-x-2 rounded-md border border-line bg-surface px-3 py-2.5 text-left hover:bg-surface-2"
      >
        <span className="flex items-center gap-x-2 font-poppins text-[13px] font-bold uppercase tracking-wider text-gold">
          <span className="h-3.5 w-1 rounded-[1px] bg-ink" />
          Agent Information
        </span>
        <ChevronDown
          className={`size-4.5 text-ink-soft transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Height animates via the grid-rows trick. */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <AgentBanner agentId={agent.agentId} phone={agent.phone} />
        </div>
      </div>
    </section>
  );
}

function AgentBanner({ agentId, phone }) {
  // Agent IDs show at least 4 digits (7 -> 0007); longer IDs get a smaller font to fit the seal.
  const shownId = agentId ? String(agentId).padStart(4, "0") : "—";

  return (
    <div className="relative mt-2 h-[80px] select-none">
      {/* Striped strip along the top, site surface fading into gold. */}
      <div
        className="absolute left-[40px] right-0 top-0 h-[24px] rounded-tr-xl"
        style={{
          background:
            "repeating-linear-gradient(110deg, rgba(0,0,0,0.2) 0 18px, transparent 18px 36px), linear-gradient(90deg, var(--c-surface-2) 0%, var(--c-gold-dark) 75%, var(--c-gold-light) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Body. */}
      <div
        className="absolute bottom-0 left-[40px] right-0 top-[20px] rounded-b-xl rounded-tl-md border border-line bg-surface shadow-[0_6px_14px_-8px_rgba(0,0,0,0.7)]"
        aria-hidden="true"
      />

      {/* Gold tab: verified mark. */}
      <span className="absolute right-0 top-0 z-10 flex h-[40px] w-[120px] items-center justify-center gap-1.5 rounded-tr-xl rounded-bl-[20px] bg-linear-to-r from-gold-light to-gold-dark font-poppins text-[14px] font-extrabold uppercase tracking-wide text-on-gold">
        Verified
        <BadgeCheck
          className="size-5 fill-green-600 text-white"
          strokeWidth={2.2}
          aria-hidden="true"
        />
      </span>

      {/* Gold seal: agent ID. */}
      <div className="absolute left-0 top-1/2 z-10 size-[80px] -translate-y-1/2 drop-shadow-[0_3px_6px_rgba(0,0,0,0.45)]">
        <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" aria-hidden="true">
          <path d={SEAL_PATH} fill="#CFA626" />
          <circle
            cx="50"
            cy="50"
            r="36"
            fill="none"
            stroke="white"
            strokeWidth="1.4"
            strokeDasharray="0.1 2.6"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-poppins text-[10px] font-extrabold uppercase leading-none tracking-wide text-black">
            Agent
          </span>
          <span
            className={`mt-0.5 max-w-[56px] truncate font-poppins font-extrabold leading-none text-[#9B0000] ${
              shownId.length <= 4 ? "text-[19px]" : shownId.length === 5 ? "text-[16px]" : "text-[13px]"
            }`}
          >
            {shownId}
          </span>
        </div>
      </div>

      {/* Body text, below the tab: the agent's WhatsApp. */}
      <div className="absolute bottom-[9px] left-[88px] right-2.5 z-10 min-w-0">
        <a
          href={whatsappLink(phone)}
          target="_blank"
          rel="noreferrer"
          className="flex w-fit max-w-full items-center gap-1.5 font-poppins text-[13px] font-bold leading-tight text-ink hover:text-gold min-[400px]:gap-2 min-[400px]:text-[16px]"
        >
          {/* Negative margin keeps the larger icon from pushing the row up into the tab. */}
          {/* The JPEG has a white margin around the green square (70% of the
              image); scaling it up inside a rounded box crops that margin away. */}
          <span className="relative -my-1.5 size-7 shrink-0 overflow-hidden rounded-[7px] min-[400px]:size-8 min-[400px]:rounded-[8px]">
            <img
              src={whatsapp_icon}
              className="absolute left-1/2 top-1/2 size-[143%] max-w-none -translate-x-1/2 -translate-y-1/2"
              alt=""
            />
          </span>
          <span className="truncate">{phone}</span>
          <span className="sr-only">Open WhatsApp chat</span>
        </a>
        <p className="mt-1.5 truncate pl-[34px] font-inter text-[10px] leading-tight text-ink-muted min-[400px]:pl-10">
          chorkix.com verified Online Agent
        </p>
      </div>
    </div>
  );
}
