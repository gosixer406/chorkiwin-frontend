import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { api } from "@/lib/api";

// Loads the logged-in player's upline agent. `contact` is undefined while
// loading, then { agent, number } (either may be null).
export function useUplineAgent(enabled = true) {
  const user = useSelector((state) => state.auth.user) || {};
  const [contact, setContact] = useState(undefined);

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    api
      .get("/api/user/upline-whatsapp", { cache: "no-store" })
      .then((response) => {
        const numbers = response.data?.numbers || [];
        const primary = numbers.find((item) => item.is_primary) || numbers[0];
        // `agent` is the nearest upline that is online on the Agent List.
        if (active)
          setContact({
            agent: response.data?.agent || null,
            number: primary?.number || null,
          });
      })
      .catch(() => active && setContact({ agent: null, number: null }));
    return () => {
      active = false;
    };
  }, [enabled]);

  return {
    loading: contact === undefined,
    // The backend only sends `agent` while that upline is online on the Agent List;
    // without the user ID set there it does not count as online.
    isOnline: Boolean(contact?.agent?.id_number),
    agentId: contact?.agent?.id_number || "",
    // The number the upline (Master Agent) set in its panel's Upline Whatsapp
    // comes first, then the online agent's Agent List number. Empty string when
    // there is no number anywhere up the chain.
    phone:
      contact?.number ||
      contact?.agent?.whatsapp ||
      user.upline_whatsapp ||
      "",
  };
}

// Loads the logged-in player's upline IMO number (set by the Master Agent on the
// Upline Whatsapp/Imo page). `phone` is "" while loading and when none is set.
export function useUplineImo(enabled = true) {
  const [numbers, setNumbers] = useState(undefined);

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    api
      .get("/api/user/upline-imo", { cache: "no-store" })
      .then((response) => active && setNumbers(response.data?.numbers || []))
      .catch(() => active && setNumbers([]));
    return () => {
      active = false;
    };
  }, [enabled]);

  const primary = (numbers || []).find((item) => item.is_primary) || (numbers || [])[0];
  return {
    loading: numbers === undefined,
    phone: primary?.number || "",
  };
}

// Loads the logged-in player's upline Telegram username (set by the Master
// Agent on the Upline Whatsapp/Imo page, without the "@"). `username` is ""
// while loading and when none is set.
export function useUplineTelegram(enabled = true) {
  const [numbers, setNumbers] = useState(undefined);

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    api
      .get("/api/user/upline-telegram", { cache: "no-store" })
      .then((response) => active && setNumbers(response.data?.numbers || []))
      .catch(() => active && setNumbers([]));
    return () => {
      active = false;
    };
  }, [enabled]);

  const primary = (numbers || []).find((item) => item.is_primary) || (numbers || [])[0];
  return {
    loading: numbers === undefined,
    username: String(primary?.number || "").replace(/^@/, ""),
  };
}

// Opens that user's chat in Telegram (the app, or Telegram web without it).
export const telegramLink = (username) =>
  `https://t.me/${encodeURIComponent(String(username || "").replace(/^@/, ""))}`;

export const whatsappLink = (phone) =>
  `https://wa.me/${String(phone).replace(/[^\d]/g, "")}`;

// IMO: a full invite link (e.g. https://s.imoim.net/XXXX) is used as-is;
// a plain number opens a chat through the imo deep link.
export const imoLink = (value) => {
  const raw = String(value || "").trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  return `imo://chat?number=${raw.replace(/[^\d]/g, "")}`;
};

export function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (text) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return [copied, copy];
}
