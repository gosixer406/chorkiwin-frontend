import Loader from "@/components/loader";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Check,
  Copy,
  Headset,
  IdCard,
  Send,
  X,
} from "lucide-react";
import { api, apiAssetUrl } from "@/lib/api";
import { VerifiedBadge } from "@/components/upline-agent-card";
import { useCopy, useUplineAgent, whatsappLink } from "@/lib/upline-agent";
import whatsapp_icon from "@/assets/img/whatsapp.png";

function AgentContactModal({ onClose, onNoAgent }) {
  const { loading, isOnline, agentId, phone } = useUplineAgent();
  const [copied, copy] = useCopy();

  // No online agent with a user ID: skip the popup.
  useEffect(() => {
    if (!loading && !isOnline) onNoAgent();
  }, [loading, isOnline, onNoAgent]);

  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copyAgentId = () => copy(agentId);

  if (loading || !isOnline) return null;

  return (
    <div
      className="fixed inset-0 z-[21000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="agent-contact-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[360px] overflow-hidden rounded-xl border border-line-strong bg-surface shadow-2xl shadow-black/50"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2.5 top-2.5 z-10 grid size-8 place-items-center rounded-full bg-black/20 text-ink-soft transition-colors hover:text-gold"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        <div className="flex flex-col items-center bg-gradient-to-b from-gold/25 via-gold/5 to-transparent px-5 pb-4 pt-6 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-gold text-on-gold ring-4 ring-gold/25">
            <Headset className="size-7" strokeWidth={1.75} />
          </span>
          <h2
            id="agent-contact-title"
            className="mt-3 font-poppins text-[16px] font-bold text-ink"
          >
            Contact With Online Agent
          </h2>
          <p className="mt-1 font-inter text-[12px] text-ink-muted">
            Message the agent on WhatsApp to claim this offer.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 px-4 pb-4">
          {loading ? (
            <Loader className="py-6" />
          ) : (
            <>
              <div className="flex items-center gap-3 rounded-lg border border-line bg-page px-3 py-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-gold">
                  <IdCard className="size-[18px]" strokeWidth={1.75} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-inter text-[11px] uppercase tracking-wide text-ink-muted">
                    Agent ID
                  </span>
                  <span className="truncate font-poppins text-[15px] font-bold text-ink">
                    {agentId || "—"}
                  </span>
                </span>
                {agentId && (
                  <button
                    type="button"
                    onClick={copyAgentId}
                    className="grid size-8 shrink-0 place-items-center rounded-md border border-line text-ink-soft transition-colors hover:border-gold/60 hover:text-gold"
                    aria-label="Copy agent ID"
                  >
                    {copied ? (
                      <Check className="size-4 text-green-500" />
                    ) : (
                      <Copy className="size-4" strokeWidth={1.75} />
                    )}
                  </button>
                )}
              </div>

              <a
                href={whatsappLink(phone)}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 rounded-lg border border-line bg-page px-3 py-2.5 transition-colors hover:border-green-500/50"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-green-500/15">
                  <img src={whatsapp_icon} className="size-[18px]" alt="" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-inter text-[11px] uppercase tracking-wide text-ink-muted">
                    Whatsapp Number
                  </span>
                  <span className="truncate font-poppins text-[15px] font-bold text-gold">
                    {phone}
                  </span>
                </span>
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-md bg-gold text-on-gold transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                >
                  <Send className="size-4" strokeWidth={1.75} />
                </span>
                <span className="sr-only">Open WhatsApp chat with {phone}</span>
              </a>

              <VerifiedBadge className="mt-1 justify-center py-1.5 text-[12px]" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Promotions() {
  const { promotionId } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const [data, setData] = useState(promotionId ? null : []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAgentContact, setShowAgentContact] = useState(false);

  useEffect(() => {
    let active = true;
    const path = promotionId
      ? `/api/promotions/${promotionId}`
      : "/api/promotions";
    setLoading(true);
    api
      .get(path)
      .then((response) => {
        if (active) setData(response.data);
      })
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [promotionId]);

  if (loading)
    return (
      <Loader className="min-h-70 bg-page" />
    );

  if (error) {
    return (
      <div className="p-4">
        <div
          role="alert"
          className="rounded-lg bg-red-500/10 p-4 text-sm text-red-300"
        >
          {error}
        </div>
      </div>
    );
  }

  if (!promotionId) {
    return (
      <main className="-mx-2 -mt-2 bg-page pb-24">
        <div className="relative mb-3 flex h-11 items-center justify-center border-b border-line bg-bar px-3">
          <h1 className="font-poppins text-[15px] font-bold text-ink">
            Promotions
          </h1>
          <Link
            to="/"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft transition-colors hover:text-gold"
            aria-label="Back to home"
          >
            <X className="size-6" />
          </Link>
        </div>
        <div className="px-2.5">
          {data.length ? (
            <div className="grid grid-cols-1 gap-3">
              {data.map((promotion) => (
                <Link
                  key={promotion.id}
                  to={`/promotions/${promotion.id}`}
                  className="overflow-hidden rounded-md border border-line bg-surface transition-colors hover:border-gold/60"
                >
                  {promotion.image_url && (
                    <img
                      src={apiAssetUrl(promotion.image_url)}
                      className="aspect-[16/7] w-full object-cover"
                      alt={promotion.title}
                    />
                  )}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-poppins text-[14px] font-semibold text-ink">
                        {promotion.title}
                      </h2>
                      {promotion.badge && (
                        <span className="shrink-0 rounded-full bg-gold px-2 py-1 text-[10px] font-bold text-on-gold">
                          {promotion.badge}
                        </span>
                      )}
                    </div>
                    {promotion.subtitle && (
                      <p className="mt-1 text-[12px] text-ink-soft">
                        {promotion.subtitle}
                      </p>
                    )}
                    {promotion.reward && (
                      <strong className="mt-2 block text-[13px] text-gold">
                        {promotion.reward}
                      </strong>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-line bg-surface p-10 text-center text-[13px] text-ink-muted">
              No active promotions right now.
            </div>
          )}
        </div>
      </main>
    );
  }

  const promotion = data;
  const goToLogin = () => {
    navigate("/login", {
      state: { returnTo: `/promotions/${promotion.id}` },
    });
  };
  const contactAgent = () => {
    if (!isLoggedIn) {
      goToLogin();
      return;
    }
    setShowAgentContact(true);
  };

  return (
    <main className="bg-page pb-24">
      <div className="sticky top-0 z-10 flex h-11 items-center justify-center border-b border-line bg-bar px-3">
        <h1 className="font-poppins text-[15px] font-bold text-ink">
          Promotion Details
        </h1>
        <Link
          to="/promotions"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft transition-colors hover:text-gold"
          aria-label="Back to promotions"
        >
          <X className="size-6" />
        </Link>
      </div>
      <div className="px-2.5 pt-3">
        {(promotion.detail_banner_url || promotion.image_url) && (
          <img
            src={apiAssetUrl(
              promotion.detail_banner_url || promotion.image_url,
            )}
            className="w-full rounded-md object-cover"
            alt={promotion.title}
          />
        )}
        <article className="mt-2.5 rounded-md border border-line bg-surface p-3.5 shadow-sm text-ink-soft">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-poppins text-[16px] font-bold text-ink">
              {promotion.title}
            </h2>
            {promotion.badge && (
              <span className="shrink-0 rounded-full bg-gold px-2 py-1 text-[10px] font-bold text-on-gold">
                {promotion.badge}
              </span>
            )}
          </div>
          {promotion.subtitle && (
            <p className="mt-1.5 text-[13px] text-ink-soft">
              {promotion.subtitle}
            </p>
          )}
          {promotion.reward && (
            <strong className="mt-2.5 block text-[15px] text-gold">
              {promotion.reward}
            </strong>
          )}
          {promotion.detail_html && (
            <div
              className="promotion-content mt-4 border-t border-line pt-4 text-[13px] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: promotion.detail_html }}
            />
          )}
          {promotion.user_registered ? (
            <div className="mt-5 rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-[13px] text-green-300">
              This promotion is already active on your account.
            </div>
          ) : promotion.deposit_selectable ? (
            <button
              type="button"
              onClick={contactAgent}
              className="mt-5 h-[42px] w-full rounded-[3px] bg-gold font-poppins text-[14px] font-semibold text-on-gold transition-opacity hover:opacity-90"
            >
              Select offer and deposit
            </button>
          ) : promotion.auto_start_on_registration && !isLoggedIn ? (
            <button
              type="button"
              onClick={goToLogin}
              className="mt-5 h-[42px] w-full rounded-[3px] bg-gold font-poppins text-[14px] font-semibold text-on-gold transition-opacity hover:opacity-90"
            >
              Sign up to activate
            </button>
          ) : null}
        </article>
      </div>
      {showAgentContact && (
        <AgentContactModal
          onClose={() => setShowAgentContact(false)}
          onNoAgent={() => navigate("/agent-list")}
        />
      )}
    </main>
  );
}
