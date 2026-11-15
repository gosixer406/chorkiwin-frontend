import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { api } from "@/lib/api";
import { DEFAULT_UPLINE_WHATSAPP } from "@/pages/new/upline-whatsapp";

// Loads the logged-in player's upline agent. `contact` is undefined while
// loading, then { agent, number } (either may be null).
export function useUplineAgent() {
  const user = useSelector((state) => state.auth.user) || {};
  const [contact, setContact] = useState(undefined);

  useEffect(() => {
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
  }, []);

  return {
    loading: contact === undefined,
    // The backend only sends `agent` while that upline is online on the Agent List;
    // without the user ID set there it does not count as online.
    isOnline: Boolean(contact?.agent?.id_number),
    agentId: contact?.agent?.id_number || "",
    phone:
      contact?.agent?.whatsapp ||
      contact?.number ||
      user.upline_whatsapp ||
      DEFAULT_UPLINE_WHATSAPP,
  };
}

export const whatsappLink = (phone) =>
  `https://wa.me/${String(phone).replace(/[^\d]/g, "")}`;

export function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (text) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return [copied, copy];
}
