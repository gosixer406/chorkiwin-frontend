import { COMMUNITY_LINKS, FALLBACK_SOCIAL_LINKS, useSocialLinks } from "@/lib/social-links";

// Facebook, Telegram and WhatsApp, always all three. A network with no link set
// in the admin panel (and no fallback) still shows, but does not open anything.
// With linked={false} every icon is shown on its own, with no link.
export default function SocialButtons({ className = "", linked = true }) {
  const links = useSocialLinks();
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      {COMMUNITY_LINKS.map(({ key, name, icon: Icon, className: color }) => {
        const href = linked ? links[key] || FALLBACK_SOCIAL_LINKS[key] : null;
        const look = `grid size-10 place-items-center rounded-full text-white shadow-md shadow-black/30 transition-transform ${color}`;
        return href ? (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={name}
            className={`${look} hover:-translate-y-0.5`}
          >
            <Icon className="size-5" />
          </a>
        ) : (
          <span
            key={key}
            role="img"
            aria-label={linked ? `${name} (coming soon)` : name}
            title={linked ? `${name} - coming soon` : undefined}
            className={look}
          >
            <Icon className="size-5" />
          </span>
        );
      })}
    </div>
  );
}
