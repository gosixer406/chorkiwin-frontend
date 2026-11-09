import GameTitle from "@/components/new/game-title";
import CategoryTitleIcon from "@/components/new/category-title-icon";
import SportsbookLaunchLoader from "@/components/sportsbook-launch-loader";
import useGameLauncher from "@/hooks/use-game-launcher";
import img9w from "@/assets/img/new/game/sports/9wickets-chorkix.webp";
import imgSaba from "@/assets/img/new/game/sports/saba-2-chorkix.webp";
import imgBti from "@/assets/img/new/game/sports/3-chorkix.webp";

const sportsbooks = [
  {
    code: "9w",
    name: "9Wickets",
    img: img9w,
    description: "Exchange sportsbook",
  },
  {
    code: "saba",
    name: "SABA Sports",
    img: imgSaba,
    description: "Seamless sportsbook",
  },
  {
    code: "bti",
    name: "BTI Sports",
    img: imgBti,
    description: "Seamless sportsbook",
  },
];

export default function Sports() {
  const launcher = useGameLauncher();
  return (
    <section className="flex flex-col gap-y-3">
      <GameTitle
        icon={<CategoryTitleIcon category="sports" />}
        title="Sports"
      />
      {launcher.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200"
        >
          {launcher.error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-y-2">
        {sportsbooks.map((sportsbook, index) => (
          <button
            type="button"
            key={sportsbook.code}
            onClick={() =>
              launcher.launchSportsbook(sportsbook.code, sportsbook.name)
            }
            disabled={Boolean(launcher.launchingId)}
            className="relative block overflow-hidden rounded-xl border border-gold/40 bg-page text-left shadow-[0_2px_10px_rgba(0,0,0,0.28)] disabled:cursor-wait"
            aria-label={`Open ${sportsbook.name}`}
          >
            <img
              src={sportsbook.img}
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              className="block h-auto w-full object-cover [image-rendering:auto] transition duration-300 hover:scale-[1.01]"
              alt={sportsbook.name}
            />
            {sportsbook.showName && (
              <span className="absolute left-3 top-3 rounded bg-black/75 px-3 py-1.5 text-sm font-bold text-white shadow">
                {sportsbook.name}
              </span>
            )}
            <span className="sr-only">{sportsbook.description}</span>
            {launcher.launchingId === `sports-${sportsbook.code}` &&
              sportsbook.code === "9w" && <SportsbookLaunchLoader />}
          </button>
        ))}
      </div>
    </section>
  );
}
