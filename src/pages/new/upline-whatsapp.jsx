import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Headphones, Send } from "lucide-react";
import PageTitle from "@/components/dashboard/page-title";
import { api } from "@/lib/api";
import whatsapp_icon from "@/assets/img/whatsapp.png";

// Fallback when the account has no upline number of its own.
export const DEFAULT_UPLINE_WHATSAPP = "+447520636263";

const whatsappLink = (phone) =>
  `https://wa.me/${String(phone).replace(/[^\d]/g, "")}`;

// "CS Manager" for a single contact, "CS Manager 1", "CS Manager 2" for several.
const numberedContacts = (title, phones) =>
  phones.map((phone, index) => ({
    phone,
    label: phones.length > 1 ? `${title} ${index + 1}` : title,
  }));

// Players see the label only; the number is used for the WhatsApp link.
function ContactRow({ label, phone }) {
  return (
    <a
      href={whatsappLink(phone)}
      target="_blank"
      rel="noreferrer"
      className="flex h-[50px] items-center gap-3 rounded-md border border-line bg-surface pl-3 pr-1.5 transition-colors hover:bg-surface-2"
    >
      <img src={whatsapp_icon} className="size-[18px] shrink-0" alt="" />
      <span className="min-w-0 flex-1 truncate font-inter text-[14px] font-semibold text-ink">
        {label}
      </span>
      <span
        className="grid size-9 shrink-0 place-items-center rounded-xl bg-gold text-on-gold"
        aria-hidden="true"
      >
        <Send className="size-[18px]" strokeWidth={1.5} />
      </span>
      <span className="sr-only">Open WhatsApp chat with {label}</span>
    </a>
  );
}

export default function UplineWhatsapp() {
  const navigate = useNavigate();
  const { isLoggedIn, user: authUser } = useSelector((state) => state.auth);
  const user = authUser || {};
  // undefined while loading, null when the upline chain has no number.
  const [primaryNumber, setPrimaryNumber] = useState(undefined);
  // undefined while loading; the same lists for every user of the site.
  const [csContacts, setCsContacts] = useState(undefined);
  const [supportOpen, setSupportOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    let active = true;
    // The backend walks up to the nearest upline with numbers and lists its primary first.
    api
      .get("/api/user/upline-whatsapp", { cache: "no-store" })
      .then((response) => {
        const numbers = response.data?.numbers || [];
        const primary = numbers.find((item) => item.is_primary) || numbers[0];
        if (active) setPrimaryNumber(primary?.number || null);
      })
      .catch(() => active && setPrimaryNumber(null));
    api
      .get("/api/user/cs-contacts", { cache: "no-store" })
      .then((response) => active && setCsContacts(response.data || {}))
      .catch(() => active && setCsContacts({}));
    return () => {
      active = false;
    };
  }, [isLoggedIn]);

  const uplinePhone =
    primaryNumber ||
    user.upline_whatsapp ||
    user.upline?.whatsapp ||
    user.upline?.phone ||
    DEFAULT_UPLINE_WHATSAPP;
  const agentPhones = [
    user.agent_whatsapp,
    user.agent?.whatsapp,
    user.agent?.phone,
  ].filter(Boolean);
  const csManagers = csContacts?.cs_manager || [];
  const agentListCs = csContacts?.agent_list_cs || [];
  const managerRows = numberedContacts(
    "CS Manager",
    csManagers.length > 0
      ? csManagers.map((contact) => contact.whatsapp)
      : [uplinePhone],
  );
  const supportRows = numberedContacts(
    "Customer Support",
    agentListCs.length > 0
      ? agentListCs.map((contact) => contact.whatsapp)
      : agentPhones,
  );
  const loading =
    isLoggedIn && (primaryNumber === undefined || csContacts === undefined);

  return (
    <div className="flex flex-1 flex-col bg-page pb-16">
      <header className="sticky top-0 z-20 bg-bar">
        <PageTitle
          title="Customer Care What's App Number"
          titleClass="font-poppins text-[15px] font-bold tracking-tight"
          className="min-h-[51px]! bg-bar px-3! text-ink"
          onClick={() => navigate("/profile")}
        />
      </header>

      <div className="flex flex-col gap-2.5 px-2.5 py-4 text-white">
        {loading ? (
          <div
            className="h-[50px] animate-pulse rounded-md border border-line bg-surface"
            aria-label="Loading number"
          />
        ) : (
          managerRows.map((row) => <ContactRow key={row.label} {...row} />)
        )}

        <h2 className="mt-3">
          <button
            type="button"
            onClick={() => setSupportOpen((open) => !open)}
            aria-expanded={supportOpen}
            aria-controls="customer-support-list"
            className="flex h-[50px] w-full items-center justify-between gap-3 rounded-md border border-line bg-surface px-3 font-inter text-[14px] font-semibold text-ink transition-colors hover:bg-surface-2"
          >
            <span className="flex min-w-0 items-center gap-3">
              <Headphones
                className="size-[18px] shrink-0 text-gold"
                aria-hidden="true"
              />
              Customer Support
            </span>
            <ChevronDown
              className={`size-5 shrink-0 text-gold transition-transform ${supportOpen ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
        </h2>
        {supportOpen && (
          <div id="customer-support-list" className="flex flex-col gap-2.5">
            {loading ? (
              <div
                className="h-[50px] animate-pulse rounded-md border border-line bg-surface"
                aria-label="Loading number"
              />
            ) : supportRows.length > 0 ? (
              supportRows.map((row) => <ContactRow key={row.label} {...row} />)
            ) : (
              <div className="grid h-[60px] place-items-center rounded-md border border-line bg-surface font-inter text-[14px] text-ink-soft">
                No Data
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
