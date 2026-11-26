import Loader from "@/components/loader";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronLeft, Search } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import GameTitle from "@/components/new/game-title";
import GameCard from "@/components/new/game-card";
import { api } from "@/lib/api";
import { normalizeGame } from "@/lib/games";
import { referenceFallbackPath } from "@/lib/catalogue-fallback";
import { withLightReferenceImage } from "@/lib/reference-games";
import {
  newCatalogueCache as catalogueCache,
  pendingNewCatalogue,
} from "@/lib/new-catalogue";
import useGameLauncher from "@/hooks/use-game-launcher";
import bngLogo from "@/assets/img/new/provider/bng.png";

const categoryCodes = {
  popular: "HT",
  sports: "SB",
  casino: "LC",
  slots: "SL",
  table: "CB",
  "hot game": "HT",
  "hot games": "HT",
  "table games": "CB",
  crash: "CR",
  fishing: "FH",
  arcade: "AR",
  lottery: "LK",
};

// Cards visible without scrolling: their artwork loads first.
const FIRST_SCREEN_CARDS = 9;

const providerLogoBase =
  "https://pub-70046af0b32640219b404f8c5b318436.r2.dev/media/provider/thumbnail";
const providerLogos = {
  AESEXY: `${providerLogoBase}/ae-sexy-logo_QkKMSso.svg`,
  SEXYBCRT: `${providerLogoBase}/ae-sexy-logo_QkKMSso.svg`,
  SEXYBACCARAT: `${providerLogoBase}/ae-sexy-logo_QkKMSso.svg`,
  ONSEXY: `${providerLogoBase}/onsexy_D37mqGr.webp`,
  HOTROAD: `${providerLogoBase}/HotRoad.webp`,
  EVOLUTION: `${providerLogoBase}/vendor-evo.png`,
  EVO: `${providerLogoBase}/vendor-evo.png`,
  PLAYTECH: `${providerLogoBase}/pt.png`,
  PT: `${providerLogoBase}/pt.png`,
  PRAGMATICPLAY: `${providerLogoBase}/PP.png`,
  PP: `${providerLogoBase}/PP.png`,
  TVBET: `${providerLogoBase}/tvb.webp`,
  VIVO: `${providerLogoBase}/vivo.webp`,
  LAVACASINO: `${providerLogoBase}/lv_Iz9zFwn.webp`,
  JACKTOP: `${providerLogoBase}/jt.webp`,
  "7MOJOS": `${providerLogoBase}/7m.png`,
  JILI: `${providerLogoBase}/jili_AjTcICu_4OJwB36.svg`,
  GTF: `${providerLogoBase}/provider-jdbgtf.webp`,
  JDB: `${providerLogoBase}/10.png`,
  BNG: bngLogo,
  BOONGO: bngLogo,
  BOOONGO: bngLogo,
  PG: `${providerLogoBase}/pg.png`,
  PGPG: `${providerLogoBase}/pg.png`,
  PGSOFT: `${providerLogoBase}/pg.png`,
  YELLOWBAT: `${providerLogoBase}/yb.webp`,
  KAGAMING: `${providerLogoBase}/kagaming.webp`,
  FC: `${providerLogoBase}/fc.webp`,
  PLAYSTAR: `${providerLogoBase}/playstar.webp`,
  EVP: `${providerLogoBase}/evp.png`,
  SLOTOPAI: `${providerLogoBase}/promo-img-1.webp`,
  CP: `${providerLogoBase}/CP.png`,
  REDTIGER: `${providerLogoBase}/Red_Tiger.png`,
  BTG: `${providerLogoBase}/BTG.png`,
  BETONGAMES: `${providerLogoBase}/beton.webp`,
  SABAPLAY: `${providerLogoBase}/sabaplay.webp`,
  KM: `${providerLogoBase}/km.png`,
  KINGMAKER: `${providerLogoBase}/km.png`,
  NOLIMITCITY: `${providerLogoBase}/NC.png`,
  NLC: `${providerLogoBase}/NC.png`,
  SPRIB: `${providerLogoBase}/spribe-large-1-e1683798958191.webp`,
  SPRIBE: `${providerLogoBase}/spribe-large-1-e1683798958191.webp`,
};

function providerKey(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function normalizeRows(response) {
  return (Array.isArray(response.data) ? response.data : [])
    .map(normalizeGame)
    .map(withLightReferenceImage)
    // Only games that actually have artwork are shown; a game with no image
    // (would fall back to a blank placeholder) is dropped from the grid.
    .filter((game) => game.uid && game.img);
}

function mergeRows(current, incoming) {
  const rows = new Map(current.map((game) => [game.uid, game]));
  incoming.forEach((game) => rows.set(game.uid, game));
  return [...rows.values()];
}

function withQuery(path, key, value) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${key}=${encodeURIComponent(value)}`;
}

function cataloguePagePath(path, page, limit, provider = "", search = "") {
  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set("limit", String(limit));
  params.set("page", String(page));
  if (provider && provider !== "All") params.set("provider", provider);
  else params.delete("provider");
  if (search) params.set("search", search);
  else params.delete("search");
  return `${pathname}?${params.toString()}`;
}

function ProviderMark({ name }) {
  if (name === "All") {
    return (
      <svg
        className="size-4"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M9.664 4.333H11.664M11.664 4.333H13.664M11.664 4.333V6.333M11.664 4.333V2.333"
          stroke="var(--c-gold)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path
          d="M1.664 4.334C1.664 3.077 1.664 2.448 2.055 2.058C2.445 1.667 3.074 1.667 4.331 1.667C5.588 1.667 6.216 1.667 6.607 2.058C6.997 2.448 6.997 3.077 6.997 4.334C6.997 5.591 6.997 6.219 6.607 6.61C6.216 7 5.588 7 4.331 7C3.074 7 2.445 7 2.055 6.61C1.664 6.219 1.664 5.591 1.664 4.334Z"
          stroke="var(--c-ink-soft)"
          strokeWidth="1.2"
        />
        <path
          d="M9 11.667C9 10.41 9 9.781 9.391 9.391C9.781 9 10.41 9 11.667 9C12.924 9 13.552 9 13.943 9.391C14.333 9.781 14.333 10.41 14.333 11.667C14.333 12.924 14.333 13.552 13.943 13.943C13.552 14.333 12.924 14.333 11.667 14.333C10.41 14.333 9.781 14.333 9.391 13.943C9 13.552 9 12.924 9 11.667Z"
          stroke="var(--c-ink-soft)"
          strokeWidth="1.2"
        />
        <path
          d="M1.664 11.667C1.664 10.41 1.664 9.781 2.055 9.391C2.445 9 3.074 9 4.331 9C5.588 9 6.216 9 6.607 9.391C6.997 9.781 6.997 10.41 6.997 11.667C6.997 12.924 6.997 13.552 6.607 13.943C6.216 14.333 5.588 14.333 4.331 14.333C3.074 14.333 2.445 14.333 2.055 13.943C1.664 13.552 1.664 12.924 1.664 11.667Z"
          stroke="var(--c-ink-soft)"
          strokeWidth="1.2"
        />
      </svg>
    );
  }
  const key = providerKey(name);
  const logo = providerLogos[key];
  const letters = String(name)
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--c-gold)_50%,transparent)] bg-page"
      aria-hidden="true"
    >
      {logo ? (
        <img
          src={logo}
          className={
            key === "BNG" || key === "BOONGO" || key === "BOOONGO"
              ? "size-4 object-contain"
              : "h-2.5 w-[15px] object-cover"
          }
          alt=""
        />
      ) : (
        <span className="text-[8px] font-black text-primary2">{letters}</span>
      )}
    </span>
  );
}

// Page numbers to show: always the first and last page, the current page and
// its neighbours, with "…" for the gaps (1 … 4 5 6 … 12).
function pageItems(page, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const start = Math.max(2, Math.min(page - 1, totalPages - 4));
  const end = Math.min(totalPages - 1, Math.max(page + 1, 5));
  const items = [1];
  if (start > 2) items.push("gap-start");
  for (let value = start; value <= end; value += 1) items.push(value);
  if (end < totalPages - 1) items.push("gap-end");
  items.push(totalPages);
  return items;
}

function CataloguePagination({ page, totalPages, onChange, disabled }) {
  if (totalPages <= 1) return null;
  const box =
    "flex h-8 min-w-8 items-center justify-center rounded border px-2 text-xs font-bold transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-40";
  const idle = "border-line bg-surface text-ink-soft hover:border-primary2";
  return (
    <nav
      aria-label="Game pages"
      className="swiper-no-swiping flex flex-wrap items-center justify-center gap-1"
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={disabled || page <= 1}
        aria-label="Previous page"
        className={`${box} ${idle}`}
      >
        <ChevronLeft className="size-4" />
      </button>
      {pageItems(page, totalPages).map((item) =>
        typeof item === "number" ? (
          <button
            type="button"
            key={item}
            onClick={() => onChange(item)}
            disabled={disabled && item !== page}
            aria-label={`Page ${item}`}
            aria-current={item === page ? "page" : undefined}
            className={`${box} ${item === page ? "border-primary2 bg-primary2 text-surface" : idle}`}
          >
            {item}
          </button>
        ) : (
          <span
            key={item}
            className="px-1 text-xs text-ink-muted"
            aria-hidden="true"
          >
            …
          </span>
        ),
      )}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={disabled || page >= totalPages}
        aria-label="Next page"
        className={`${box} ${idle}`}
      >
        <ChevronLeft className="size-4 -scale-x-100" />
      </button>
    </nav>
  );
}

export default function CatalogueSection({
  title,
  icon,
  category = "",
  endpoint = "/api/9w/games/all?limit=90",
  limit = 90,
  batchSize = 40,
  showTools = false,
  providerOrder = [],
  gameImageOverrides = {},
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const categoryCode =
    categoryCodes[String(title || category).toLowerCase()] || "";
  // The provider filter rides in router state so the tab URL stays clean.
  const urlProvider = categoryCode ? location.state?.provider || "" : "";
  const basePath = useMemo(() => {
    let path = endpoint;
    if (category) path = withQuery(path, "category", category);
    return path;
  }, [category, endpoint]);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(limit) || Number(batchSize) || 40),
  );
  const provider = showTools ? urlProvider || "All" : "All";
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  // The page belongs to one provider + search; changing either starts at 1.
  const filterKey = `${provider}|${deferredSearch}`;
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;
  const requestPath = useMemo(
    () => cataloguePagePath(basePath, page, pageSize, provider, deferredSearch),
    [basePath, deferredSearch, page, pageSize, provider],
  );
  const cached = useMemo(() => catalogueCache.get(requestPath), [requestPath]);
  const [games, setGames] = useState(cached?.games || []);
  const [meta, setMeta] = useState(cached?.meta || {});
  const [loading, setLoading] = useState(!cached);
  const [catalogueError, setCatalogueError] = useState("");
  const sectionRef = useRef(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const launcher = useGameLauncher();

  useEffect(() => {
    let active = true;
    let retryTimer;
    let attempt = 0;
    const freshCache = catalogueCache.get(requestPath);

    window.queueMicrotask(() => {
      if (!active) return;
      setGames(freshCache?.games || []);
      // Keep the provider row and page count as they are while the next page
      // or another provider loads, so they don't empty out and jump.
      setMeta(
        (current) =>
          freshCache?.meta || {
            providers: current.providers,
            total: current.total,
            pages: current.pages,
          },
      );
      setLoading(!freshCache);
    });

    const load = async () => {
      try {
        let response = await api.get(requestPath);
        if (!active) return;
        let rows = normalizeRows(response);
        const fallbackPath = referenceFallbackPath(requestPath);
        if (!rows.length && !response.meta?.loading && fallbackPath) {
          response = await api.get(fallbackPath);
          if (!active) return;
          rows = normalizeRows(response);
        }
        setCatalogueError("");
        setMeta((current) =>
          response.meta?.providers?.length
            ? response.meta
            : { ...(response.meta || {}), providers: current.providers },
        );
        if (response.meta?.loading) {
          setGames((current) => mergeRows(current, rows));
          if (rows.length) setLoading(false);
        } else {
          setGames(rows);
          catalogueCache.set(requestPath, {
            games: rows,
            meta: response.meta || {},
            timestamp: Date.now(),
          });
          setLoading(false);
        }
        if (response.meta?.loading && attempt < 30) {
          attempt += 1;
          retryTimer = window.setTimeout(load, 1500);
        } else if (response.meta?.loading) {
          setLoading(false);
        }
      } catch (error) {
        if (!active) return;
        setCatalogueError(
          error.message || "Games are temporarily unavailable.",
        );
        setLoading(false);
      }
    };

    const pending = pendingNewCatalogue(requestPath);
    if (pending) {
      // Reuse the background startup request instead of starting over.
      pending
        .catch(() => null)
        .then(() => {
          if (!active) return;
          const warmed = catalogueCache.get(requestPath);
          if (!warmed) return load();
          setGames(warmed.games);
          setMeta(warmed.meta);
          setLoading(false);
        });
    } else if (!freshCache || Date.now() - freshCache.timestamp > 5 * 60 * 1000)
      load();
    return () => {
      active = false;
      window.clearTimeout(retryTimer);
    };
  }, [requestPath]);

  // Page count from the category's game total (only games with artwork are
  // counted by the API, so every page it promises has games on it).
  const totalGames = Number(meta.total) || 0;
  const totalPages = Math.max(
    1,
    Number(meta.pages) || Math.ceil(totalGames / pageSize) || 1,
  );
  const goToPage = (next) => {
    const target = Math.min(Math.max(1, next), totalPages);
    if (target === page) return;
    setPageState({ key: filterKey, page: target });
    // Back to the top of this category so the new page starts in view.
    sectionRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  const providers = useMemo(() => {
    const metadataNames = (Array.isArray(meta.providers) ? meta.providers : [])
      .map((row) => (typeof row === "string" ? row : row?.name))
      .filter(Boolean);
    const names = Array.from(
      new Set([
        ...metadataNames,
        ...games.map((game) => game.provider).filter(Boolean),
      ]),
    );
    const priority = new Map(
      providerOrder.map((name, index) => [providerKey(name), index]),
    );
    const orderedNames = names
      .map((name, index) => ({ name, index }))
      .sort((left, right) => {
        const leftPriority = priority.get(providerKey(left.name));
        const rightPriority = priority.get(providerKey(right.name));
        if (leftPriority !== undefined || rightPriority !== undefined) {
          if (leftPriority === undefined) return 1;
          if (rightPriority === undefined) return -1;
          return leftPriority - rightPriority;
        }
        return left.index - right.index;
      })
      .map(({ name }) => name);
    return ["All", ...orderedNames];
  }, [games, meta.providers, providerOrder]);

  const decoratedGames = useMemo(
    () =>
      games.map((game) => {
        const replacement = gameImageOverrides[game.uid];
        return replacement
          ? { ...game, img: replacement, fallbackImg: game.img }
          : game;
      }),
    [gameImageOverrides, games],
  );
  const visibleGames = useMemo(
    () =>
      decoratedGames.filter((game) => {
        const matchesProvider =
          provider === "All" ||
          providerKey(game.provider) === providerKey(provider);
        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          `${game.name} ${game.provider}`.toLowerCase().includes(query);
        return matchesProvider && matchesSearch;
      }),
    [decoratedGames, provider, search],
  );
  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? decoratedGames.filter((game) =>
          `${game.name} ${game.provider}`.toLowerCase().includes(query),
        )
      : [];
  }, [decoratedGames, search]);
  const renderedGames = visibleGames;

  // Keep the active provider pill in view: centre it in the row whenever the
  // selection or the list changes. Only the row scrolls, never the page.
  const providerRowRef = useRef(null);
  const providerCount = providers.length;
  useEffect(() => {
    const row = providerRowRef.current;
    if (!row) return;
    const pill =
      provider === "All"
        ? null
        : [...row.children].find((child) => child.dataset.provider === provider);
    const left = pill
      ? pill.offsetLeft - (row.clientWidth - pill.offsetWidth) / 2
      : 0;
    row.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [provider, providerCount, searchOpen]);

  // Mouse drag scrolls the row the way the pointer moves (drag left → the
  // row moves left); touch already scrolls natively. A drag doesn't count
  // as a click on the pill under the pointer.
  const dragRef = useRef(null);
  const onRowPointerDown = (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    dragRef.current = {
      x: event.clientX,
      left: event.currentTarget.scrollLeft,
      moved: false,
    };
  };
  const onRowPointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) < 5) return;
    if (!drag.moved) event.currentTarget.setPointerCapture(event.pointerId);
    drag.moved = true;
    event.currentTarget.scrollLeft = drag.left - dx;
  };
  const onRowPointerUp = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (drag?.moved) {
      // Swallow the click that follows the drag.
      window.addEventListener(
        "click",
        (clickEvent) => clickEvent.stopPropagation(),
        { capture: true, once: true },
      );
    }
  };

  const selectProvider = (name) => {
    if (!categoryCode) return;
    navigate(location.pathname, {
      replace: true,
      state: name === "All" ? null : { provider: name },
    });
  };

  if (showTools && searchOpen) {
    return (
      <section
        role="dialog"
        aria-label="Search games"
        className="flex min-h-[390px] flex-col bg-page"
      >
        <div className="flex min-h-14 items-center gap-2 bg-page p-3">
          <button
            type="button"
            onClick={() => {
              setSearchOpen(false);
              setSearch("");
            }}
            aria-label="Close search"
            className="grid size-5 shrink-0 place-items-center rounded border border-line-strong text-ink-soft"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <input
            autoFocus
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-8 min-w-0 grow rounded border border-line bg-page px-3 text-[10px] text-white placeholder:text-ink-muted"
            placeholder="Search games"
            aria-label="Search games"
          />
          <button
            type="button"
            aria-label="Submit search"
            className="grid size-7 place-items-center text-white"
          >
            <Search className="size-5" />
          </button>
        </div>
        {search.trim() ? (
          <div className="flex flex-col gap-3 p-2">
            <div className="grid grid-cols-3 gap-1">
              {searchResults.map((game) => (
                <GameCard
                  item={game}
                  key={game.referenceId || game.uid}
                  onLaunch={() => launcher.launchGame(game)}
                  launching={launcher.launchingId === game.uid}
                />
              ))}
            </div>
            <CataloguePagination
              page={page}
              totalPages={totalPages}
              onChange={goToPage}
              disabled={loading}
            />
          </div>
        ) : (
          <div className="grid flex-1 place-items-center pb-24 text-xs text-ink-soft">
            Start typing to search games
          </div>
        )}
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="flex scroll-mt-28 flex-col gap-3"
      aria-label={title}
    >
      <GameTitle icon={icon} title={title} />

      {showTools && (
        // swiper-no-swiping: dragging the provider row scrolls it instead of
        // swiping the home page over to the next category.
        <div className="swiper-no-swiping flex h-[54px] items-center gap-1 overflow-hidden rounded-[6px] border border-line bg-surface p-1.5">
          <button
            type="button"
            onClick={() => selectProvider("All")}
            aria-label="Show all providers"
            aria-pressed={provider === "All"}
            className={`flex size-8 shrink-0 items-center justify-center rounded-full border bg-page focus:outline-none ${provider === "All" ? "casino-provider-pill-active border-primary2 text-primary2" : "border-[color-mix(in_srgb,var(--c-gold)_50%,transparent)] text-white"}`}
          >
            <ProviderMark name="All" />
          </button>
          <div
            ref={providerRowRef}
            onPointerDown={onRowPointerDown}
            onPointerMove={onRowPointerMove}
            onPointerUp={onRowPointerUp}
            onPointerCancel={onRowPointerUp}
            className="relative flex min-w-0 grow cursor-grab gap-1.5 overflow-x-auto overscroll-x-contain select-none hide-scrollbar active:cursor-grabbing"
          >
            {providers
              .filter((name) => name !== "All")
              .map((name) => (
                <button
                  type="button"
                  key={name}
                  data-provider={name}
                  draggable={false}
                  onClick={() => selectProvider(name)}
                  aria-label={`Filter by ${name} provider`}
                  aria-pressed={provider === name}
                  className={`flex shrink-0 items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-[14px] font-semibold tracking-[0.28px] whitespace-nowrap focus:outline-none ${provider === name ? "casino-provider-pill-active border-primary2 text-primary2" : "border-[color-mix(in_srgb,var(--c-gold)_50%,transparent)] text-white"}`}
                >
                  <ProviderMark name={name} />
                  <span>{name}</span>
                </button>
              ))}
          </div>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label={`Search ${title} games`}
            className="-my-1.5 -mr-1.5 flex size-13 shrink-0 items-center justify-center bg-primary2 focus:outline-none"
          >
            <svg
              className="size-[18px]"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle
                cx="7.364"
                cy="9.001"
                r="5.727"
                stroke="var(--c-surface)"
                strokeWidth="1.5"
              />
              <path
                d="M12.273 12.273L16.364 16.364"
                stroke="var(--c-surface)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      )}

      {(catalogueError || launcher.error) && (
        <div
          role="alert"
          className="mb-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200"
        >
          {launcher.error || catalogueError}
        </div>
      )}

      {loading ? (
        <Loader />
      ) : visibleGames.length ? (
        <div className="grid grid-cols-3 gap-1">
          {renderedGames.map((game, index) => (
            <GameCard
              item={game}
              key={game.referenceId || game.uid}
              priority={index < FIRST_SCREEN_CARDS}
              onLaunch={() => launcher.launchGame(game)}
              launching={launcher.launchingId === game.uid}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-line bg-surface px-4 py-10 text-center text-sm text-ink-muted">
          {provider !== "All"
            ? "No games match this provider."
            : "The provider catalogue is still syncing. Please refresh shortly."}
        </div>
      )}

      {totalGames > 0 && (
        <div className="flex flex-col items-center gap-2 pb-2">
          <CataloguePagination
            page={page}
            totalPages={totalPages}
            onChange={goToPage}
            disabled={loading}
          />
          <p className="text-[10px] leading-none text-ink-muted">
            Page {page} of {totalPages} · {totalGames} games
          </p>
        </div>
      )}
    </section>
  );
}
