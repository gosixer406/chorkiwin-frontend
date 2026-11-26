import { useEffect, useState } from "react";
import { FaFacebookF, FaTelegramPlane, FaWhatsapp } from "react-icons/fa";

import { api } from "@/lib/api";

export const COMMUNITY_LINKS = [
  {
    key: "facebook",
    name: "Facebook",
    icon: FaFacebookF,
    className: "bg-[#1877F2]",
  },
  {
    key: "telegram",
    name: "Telegram",
    icon: FaTelegramPlane,
    className: "bg-[#229ED9]",
  },
  {
    key: "whatsapp",
    name: "WhatsApp",
    icon: FaWhatsapp,
    className: "bg-[#25D366]",
  },
];

// Used when the admin panel has no link set for that network.
export const FALLBACK_SOCIAL_LINKS = {
  facebook: "",
  telegram: "",
  whatsapp: "",
};

// One request per page load, shared by every component that shows the links.
let pending = null;
function loadSocialLinks() {
  if (!pending) {
    pending = api
      .get("/api/site/social-links", { auth: false })
      .then((response) => response?.data || {})
      .catch(() => {
        pending = null;
        return {};
      });
  }
  return pending;
}

// The site's links, set in the admin panel's Social Media Setting.
export function useSocialLinks() {
  const [links, setLinks] = useState({});
  useEffect(() => {
    let alive = true;
    loadSocialLinks().then((data) => {
      if (alive) setLinks(data);
    });
    return () => {
      alive = false;
    };
  }, []);
  return links;
}
