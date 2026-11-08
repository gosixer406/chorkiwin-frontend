import { lazy, startTransition, Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { HOME_TAB_CODES, HOME_TAB_PATHS } from "@/lib/new-catalogue";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import PosterSlider from "@/components/poster-slider";
import PageMarquee from "@/components/page-marquee";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

import PopularComponent from "./popular";

import poster_1 from "@/assets/img/homepage/poster/1.png";
import poster_2 from "@/assets/img/homepage/poster/2.png";
import poster_3 from "@/assets/img/homepage/poster/3.png";
import poster_4 from "@/assets/img/homepage/poster/4.png";
import poster_5 from "@/assets/img/homepage/poster/5.png";
import icon_1 from "@/assets/img/new/category-hd/cat-nav-icon-exclusive-gold.png";
import icon_2 from "@/assets/img/new/category-hd/cat-nav-icon-sports-1-gold.png";
import sports_ball from "@/assets/img/new/category-hd/cat-nav-icon-sports-2-gold.png";
import icon_3 from "@/assets/img/new/category-hd/cat-nav-icon-casino-gold.png";
import icon_4 from "@/assets/img/new/category-hd/cat-nav-icon-slots-gold.png";
import slot_flare from "@/assets/img/new/category-hd/cat-nav-lens-flare.png";
import icon_5 from "@/assets/img/new/category-hd/cat-nav-icon-table-gold.png";
import icon_6 from "@/assets/img/new/category-hd/cat-nav-icon-crash-gold.png";
import icon_7 from "@/assets/img/new/category-hd/cat-nav-icon-fishing-gold.png";
import icon_8 from "@/assets/img/new/category-hd/cat-nav-icon-arcade-gold.png";
import icon_9 from "@/assets/img/new/category-hd/cat-nav-icon-lottery-gold.png";
import category_pod_bg from "@/assets/img/new/category-hd/cat-nav-pod-bg-blue.svg";
import category_pod_bar from "@/assets/img/new/category-hd/cat-nav-bar-pod-blue.svg";
import { api, apiAssetUrl, readSession } from "@/lib/api";
import { formatAnnouncementTime } from "@/lib/announcements";

// The last banners/notices are kept per viewer (agents can scope their own),
// so a returning visit paints them immediately. They are refetched only once
// the saved copy is older than 5 minutes.
const HOME_SECTIONS_KEY = "velki_home_sections_v1";
const HOME_SECTIONS_TTL = 5 * 60 * 1000;
const homeSectionsViewer = () => String(readSession().user?.id || "guest");

function readSavedEntry() {
  try {
    const saved = JSON.parse(localStorage.getItem(HOME_SECTIONS_KEY) || "null");
    return saved?.viewer === homeSectionsViewer() ? saved : null;
  } catch {
    return null;
  }
}

function readSavedHomeSections() {
  return readSavedEntry()?.data ?? null;
}

function homeSectionsFresh() {
  const at = readSavedEntry()?.at;
  return typeof at === "number" && Date.now() - at < HOME_SECTIONS_TTL;
}

function saveHomeSections(data) {
  try {
    localStorage.setItem(
      HOME_SECTIONS_KEY,
      JSON.stringify({ viewer: homeSectionsViewer(), data, at: Date.now() }),
    );
  } catch {
    // Storage full or blocked: the page still works without it.
  }
}

const Sports = lazy(() => import("./sports"));
const Casino = lazy(() => import("./casino"));
const Slots = lazy(() => import("./slots"));
const Table = lazy(() => import("./table"));
const Crash = lazy(() => import("./crash"));
const Fishing = lazy(() => import("./fishing"));
const Arcade = lazy(() => import("./arcade"));
const Lottery = lazy(() => import("./lottery"));

function AnnouncementDrawer({ open, onClose, notices }) {
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => event.key === "Escape" && onClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose, open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Announcements"
          className="fixed inset-0 z-[30000] flex justify-center bg-black/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="flex h-full w-full max-w-[480px] flex-col overflow-hidden bg-page"
            initial={{ scale: 0.96 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            <header className="relative flex h-[51px] shrink-0 items-center justify-center bg-bar px-4">
              <h2 className="font-poppins text-[15px] font-bold tracking-tight text-ink">
                Announcements
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close announcements"
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded p-1 text-ink transition-colors hover:text-gold focus:outline-none focus:ring-2 focus:ring-gold/60"
              >
                <X className="size-6" strokeWidth={2.25} />
              </button>
            </header>
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto bg-page px-[13px] py-3 no-scrollbar">
              {notices.map((notice, index) => (
                <article
                  key={notice.id || index}
                  className="rounded-md border border-line bg-surface px-3.5 py-3"
                >
                  <h3 className="mb-1.5 flex items-center gap-x-2 font-poppins text-[13px] font-bold uppercase tracking-wider text-gold">
                    <span className="h-3.5 w-1 shrink-0 rounded-[1px] bg-ink" />
                    {notice.title || "Announcement"}
                  </h3>
                  <p className="whitespace-pre-wrap font-bangla text-sm leading-6 text-ink-soft">
                    {notice.message}
                  </p>
                  {notice.starts_at && (
                    <p className="mt-1.5 text-xs text-ink-soft">
                      From Time: {formatAnnouncementTime(notice.starts_at)}
                    </p>
                  )}
                  {notice.ends_at && (
                    <p className="mt-0.5 text-xs text-ink-soft">
                      To Time: {formatAnnouncementTime(notice.ends_at)}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

const tab_icon_shape = (
  <svg
    className="hidden"
    viewBox="0 0 114 76"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 0H114L89.6839 56.8951C88.7486 59.0838 85.4195 60.6039 81.6347 60.5703L29.4662 60.1089C25.6969 60.0755 22.4536 58.5097 21.6121 56.317L0 0Z"
      fill="url(#paint0_linear_172_93)"
    />
    <path
      d="M26.5383 0H35.7107L46.2098 61.6796H42.9622L26.5383 0Z"
      fill="url(#paint1_linear_172_93)"
    />
    <path
      d="M95.1278 0H85.9554L72.9929 61.6796H76.2404L95.1278 0Z"
      fill="url(#paint2_linear_172_93)"
    />
    <path
      d="M66.454 0H52.3549L56.5489 61.6796H59.7965L66.454 0Z"
      fill="url(#paint3_linear_172_93)"
    />
    <g filter="url(#filter0_d_172_93)">
      <path
        d="M23.802 63.5028L23.802 54.9443L56.3309 59.6897L88.8599 54.9443V62.5834C88.8599 64.0136 88.2237 65.3698 87.0934 66.0956C68.7105 77.899 32.2685 73.5716 24.6242 65.8778C24.0251 65.275 23.802 64.3916 23.802 63.5028Z"
        fill="url(#paint4_linear_172_93)"
      />
    </g>
    <g filter="url(#filter1_i_172_93)">
      <path
        d="M56.4493 66.6296C74.4236 66.6296 88.9947 61.2732 88.9947 54.6659C88.9947 48.0585 74.4236 42.7021 56.4493 42.7021C38.4749 42.7021 23.9038 48.0585 23.9038 54.6659C23.9038 61.2732 38.4749 66.6296 56.4493 66.6296Z"
        fill="url(#paint5_linear_172_93)"
      />
    </g>
    <defs>
      <filter
        id="filter0_d_172_93"
        x="22.9488"
        y="54.9443"
        width="66.7642"
        height="20.1569"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="0.853133" />
        <feGaussianBlur stdDeviation="0.426566" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_172_93"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_172_93"
          result="shape"
        />
      </filter>
      <filter
        id="filter1_i_172_93"
        x="23.9038"
        y="42.1511"
        width="65.0909"
        height="24.4783"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="BackgroundImageFix"
          result="shape"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="-2.20426" />
        <feGaussianBlur stdDeviation="0.275534" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.119661 0 0 0 0 0.570054 0 0 0 0 0.802885 0 0 0 1 0"
        />
        <feBlend
          mode="normal"
          in2="shape"
          result="effect1_innerShadow_172_93"
        />
      </filter>
      <linearGradient
        id="paint0_linear_172_93"
        x1="56.9999"
        y1="0"
        x2="56.9999"
        y2="61.6796"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="var(--c-gold)" stopOpacity="0" />
        <stop offset="0.5" stopColor="var(--c-gold)" stopOpacity="0.15" />
        <stop offset="1" stopColor="var(--c-gold)" />
      </linearGradient>
      <linearGradient
        id="paint1_linear_172_93"
        x1="61.9476"
        y1="0"
        x2="61.9476"
        y2="61.6796"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0.2" stopColor="var(--c-gold)" stopOpacity="0" />
        <stop offset="0.5" stopColor="var(--c-gold)" stopOpacity="0.3" />
        <stop offset="1" stopColor="var(--c-gold)" />
      </linearGradient>
      <linearGradient
        id="paint2_linear_172_93"
        x1="61.9431"
        y1="0"
        x2="61.9431"
        y2="61.6796"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0.2" stopColor="var(--c-gold)" stopOpacity="0" />
        <stop offset="0.5" stopColor="var(--c-gold)" stopOpacity="0.3" />
        <stop offset="1" stopColor="var(--c-gold)" />
      </linearGradient>
      <linearGradient
        id="paint3_linear_172_93"
        x1="58.7959"
        y1="2.30667e-05"
        x2="58.7959"
        y2="62.6002"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0.201923" stopColor="var(--c-gold)" stopOpacity="0" />
        <stop offset="0.5" stopColor="var(--c-gold)" stopOpacity="0.3" />
        <stop offset="1" stopColor="var(--c-gold)" />
      </linearGradient>
      <linearGradient
        id="paint4_linear_172_93"
        x1="32.4763"
        y1="58.2141"
        x2="39.3888"
        y2="82.568"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="var(--c-gold-dark)" />
        <stop offset="0.275" stopColor="var(--c-gold-light)" />
        <stop offset="0.826923" stopColor="var(--c-gold-dark)" />
        <stop offset="1" stopColor="var(--c-gold)" />
      </linearGradient>
      <linearGradient
        id="paint5_linear_172_93"
        x1="32.5826"
        y1="46.8894"
        x2="43.3984"
        y2="76.6602"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="var(--c-gold-dark)" />
        <stop offset="0.275" stopColor="var(--c-gold-light)" />
        <stop offset="0.5" stopColor="var(--c-gold)" />
        <stop offset="0.751146" stopColor="var(--c-gold-light)" />
        <stop offset="1" stopColor="var(--c-gold)" />
      </linearGradient>
    </defs>
  </svg>
);

function CategoryIcon({ name }) {
  return (
    <div
      // The icon PNGs are gold artwork; this shifts them onto the sky-blue accent.
      className="absolute inset-0 translate-y-0 transition-transform duration-500 [filter:hue-rotate(165deg)_saturate(1.15)] group-data-[selected=true]:-translate-y-2"
      aria-hidden="true"
    >
      {name === "popular" && (
        <img
          src={icon_1}
          className="pointer-events-none absolute h-[28.5px] w-[35.25px] object-cover left-[calc(50%-19.9px)] top-[20.2px]"
          alt=""
        />
      )}
      {name === "sports" && (
        <div className="absolute h-[43.2px] w-[44.1px] left-[calc(50%-24.3px)] top-[10.8px]">
          <img
            src={icon_2}
            className="pointer-events-none absolute h-[40.5px] w-[40.5px] object-cover left-[calc(50%-13.1px)] top-[calc(50%-18.9px)]"
            alt=""
          />
          <img
            src={sports_ball}
            className="pointer-events-none absolute left-[-3.86px] top-4.25 h-[26.25px] w-[26.25px] object-cover"
            alt=""
          />
        </div>
      )}
      {name === "casino" && (
        <img
          src={icon_3}
          className="pointer-events-none absolute h-[35.6px] w-[33.9px] object-contain object-bottom left-[calc(50%-18.3px)] top-[14.9px]"
          alt=""
        />
      )}
      {name === "slots" && (
        <>
          <img
            src={icon_4}
            className="pointer-events-none absolute h-[26.7px] w-[27.9px] object-cover left-[calc(50%+11.7px)] top-[19.3px]"
            alt=""
          />
          <img
            src={icon_4}
            className="pointer-events-none absolute h-[26.7px] w-[27.9px] object-cover left-[calc(50%-30.3px)] top-[19.3px]"
            alt=""
          />
          <img
            src={icon_4}
            className="pointer-events-none absolute h-[37.4px] w-9.75 object-cover left-[calc(50%-21.75px)] top-[13.1px]"
            alt=""
          />
          <img
            src={slot_flare}
            className="pointer-events-none absolute h-[13.5px] w-[21.6px] object-cover left-[49.7px] top-[11.4px]"
            alt=""
          />
          <img
            src={slot_flare}
            className="pointer-events-none absolute h-[9.75px] w-[15.75px] object-cover left-[31.4px] top-5.5"
            alt=""
          />
          <img
            src={slot_flare}
            className="pointer-events-none absolute h-[9.75px] w-[15.75px] object-cover left-[55.5px] top-[31.8px]"
            alt=""
          />
        </>
      )}
      {name === "table" && (
        <img
          src={icon_5}
          className="pointer-events-none absolute h-[45.5px] w-[35.4px] object-cover left-[calc(50%-19.7px)] top-[11.6px]"
          alt=""
        />
      )}
      {name === "crash" && (
        <img
          src={icon_6}
          className="pointer-events-none absolute h-8.25 w-[27.5px] object-cover left-[calc(50%-15.75px)] top-[18.7px]"
          alt=""
        />
      )}
      {name === "fishing" && (
        <img
          src={icon_7}
          className="pointer-events-none absolute h-[40.1px] w-[40.1px] object-cover left-[calc(50%-22.65px)] top-[13.1px]"
          alt=""
        />
      )}
      {name === "arcade" && (
        <div className="pointer-events-none absolute h-[31.2px] w-[46.4px] overflow-hidden left-[calc(50%-24.9px)] top-[17.5px]">
          <img
            src={icon_8}
            className="absolute left-[-17.24%] top-[0.3%] h-[108.31%] w-[130.14%] max-w-none"
            alt=""
          />
        </div>
      )}
      {name === "lottery" && (
        <img
          src={icon_9}
          className="pointer-events-none absolute h-[40.1px] w-[40.1px] object-cover left-[calc(50%-22.2px)] top-[13.1px]"
          alt=""
        />
      )}
    </div>
  );
}

export default function Popular() {
  const router = useLocation();
  const navigate = useNavigate();
  const { category: categoryParam } = useParams();
  const [homeSections, setHomeSections] = useState(readSavedHomeSections);
  const [announcementsOpen, setAnnouncementsOpen] = useState(false);
  const categoryTabRefs = useRef(new Map());
  const categoryScrollerRef = useRef(null);
  const [swiper, setSwiper] = useState(null);
  // Slide whose neighbours are mounted; only advances once a swipe settles,
  // so new game lists never mount (and lay out) mid-swipe.
  const [settledIndex, setSettledIndex] = useState(null);

  const fallbackPosters = [
    {
      img: poster_1,
      path: "/promotions",
    },
    {
      img: poster_2,
      path: "/promotions",
    },
    {
      img: poster_3,
      path: "/promotions",
    },
    {
      img: poster_4,
      path: "/promotions",
    },
    {
      img: poster_5,
      path: "/promotions",
    },
  ];
  const posters = homeSections?.hero_slides?.length
    ? homeSections.hero_slides.map((slide) => ({
        img: apiAssetUrl(slide.image_url),
        path: slide.link_url || "/promotions",
        label: slide.label || "Promotion",
      }))
    : fallbackPosters;
  const noticeItems = homeSections?.notices ?? [];
  const notices = noticeItems.map((notice) => notice.message);

  const tabs = [
    {
      name: "popular",
      icon: icon_1,
      component: <PopularComponent />,
    },
    {
      name: "sports",
      icon: icon_2,
      component: <Sports />,
    },
    {
      name: "Casino",
      icon: icon_3,
      component: <Casino />,
    },
    {
      name: "Slots",
      icon: icon_4,
      component: <Slots />,
    },
    {
      name: "Table",
      icon: icon_5,
      component: <Table />,
    },
    {
      name: "Crash",
      icon: icon_6,
      component: <Crash />,
    },
    {
      name: "Fishing",
      icon: icon_7,
      component: <Fishing />,
    },
    {
      name: "Arcade",
      icon: icon_8,
      component: <Arcade />,
    },
    {
      name: "Lottery",
      icon: icon_9,
      component: <Lottery />,
    },
  ];
  const activeQuery = String(categoryParam || "").toLowerCase();
  const active_tab =
    tabs.find((tab) => tab.name.toLowerCase() === activeQuery) || tabs[0];
  const activeIndex = tabs.indexOf(active_tab);

  // Tab clicks and nav links change the URL; slide the panel to match.
  useEffect(() => {
    if (swiper && !swiper.destroyed && swiper.activeIndex !== activeIndex) {
      swiper.slideTo(activeIndex);
    }
  }, [swiper, activeIndex]);

  // autoHeight only re-measures on slide change; game lists load later, so
  // re-measure whenever the active panel's content changes size.
  useEffect(() => {
    if (!swiper || swiper.destroyed) return;
    const panel = swiper.slides[activeIndex]?.firstElementChild;
    if (!panel) return;
    const observer = new ResizeObserver(() => {
      if (!swiper.destroyed) swiper.updateAutoHeight(0);
    });
    observer.observe(panel);
    return () => observer.disconnect();
  }, [swiper, activeIndex]);

  useEffect(() => {
    if (homeSectionsFresh()) return undefined;
    let active = true;
    api
      .get("/api/home-sections")
      .then((response) => {
        if (!active || !response.data) return;
        setHomeSections(response.data);
        saveHomeSections(response.data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const scroller = categoryScrollerRef.current;
    const selected = categoryTabRefs.current.get(active_tab.name.toLowerCase());
    if (!scroller || !selected) return;

    const targetLeft =
      selected.offsetLeft + selected.offsetWidth / 2 - scroller.clientWidth / 2;
    const maxLeft = scroller.scrollWidth - scroller.clientWidth;
    scroller.scrollTo({
      left: Math.max(0, Math.min(targetLeft, maxLeft)),
      behavior: "smooth",
    });
  }, [active_tab.name]);

  // Old ?category=XX links and unknown paths land on the clean tab URL.
  const legacyTab =
    HOME_TAB_CODES[String(new URLSearchParams(router.search).get("category") || "").toUpperCase()];
  if (legacyTab) return <Navigate to={`/${legacyTab}`} replace />;
  if (categoryParam && !HOME_TAB_PATHS.has(activeQuery)) return <Navigate to="/" replace />;

  return (
    <div className="flex flex-col gap-y-0">
      <PosterSlider
        pagination={true}
        navBtnClass="size-4 border border-solid border-white/30 bg-white/20 rounded [&_svg]:size-4 text-white! hover:bg-white/40! hover:text-black"
        autoPlay={true}
      >
        {posters.map((item, idx) => (
          <SwiperSlide key={idx} className="h-[104px]! w-full!">
            <Link
              to={item.path}
              className="block h-[104px] w-full overflow-hidden rounded-lg hover:scale-101"
            >
              <img
                src={item.img}
                alt={item.label || "Poster"}
                // Only the first banner is needed for the first paint.
                loading={idx === 0 ? "eager" : "lazy"}
                fetchPriority={idx === 0 ? "high" : "low"}
                decoding="async"
                className="size-full object-cover object-center"
              />
            </Link>
          </SwiperSlide>
        ))}
      </PosterSlider>

      <button
        type="button"
        onClick={() => setAnnouncementsOpen(true)}
        aria-label="View announcements"
        // A site without live announcements has no bar; while loading it holds its place.
        className={`mt-1 w-full cursor-pointer items-center gap-x-2 rounded-lg border border-solid border-line bg-surface px-2 py-1 text-left transition-colors hover:bg-surface-2 focus:outline-none focus:ring-2 focus:ring-gold/60 ${homeSections && !notices.length ? "hidden" : "flex"}`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13.5719 1.20217C13.491 1.26194 13.3293 1.50803 13.0059 2.06701C12.7563 2.49944 12.5383 2.91076 12.5172 2.98459C12.3871 3.46623 13.027 3.82131 13.368 3.45569C13.4172 3.39944 13.6633 3.00217 13.9094 2.56975C14.3207 1.85256 14.3629 1.76467 14.3594 1.6135C14.3594 1.51858 14.3313 1.40959 14.2961 1.35334C14.1449 1.12483 13.7934 1.051 13.5719 1.20217Z"
            fill="var(--c-gold)"
          />
          <path
            d="M8.86914 1.68031C8.40156 1.84554 8.1168 2.2639 8.12031 2.77367C8.12383 2.88265 8.14492 3.03031 8.16953 3.10062C8.21523 3.22367 8.2082 3.24476 8.01484 3.66312C7.46289 4.86195 6.58398 6.07484 5.43086 7.22445C5.17773 7.47406 4.82266 7.80804 4.64336 7.96273C4.46055 8.11742 4.26367 8.28265 4.20742 8.33539L4.10547 8.42328L5.2375 10.392C5.86328 11.4713 6.37656 12.3608 6.38008 12.3678C6.38711 12.3748 6.69297 12.2764 7.06211 12.1498C8.63359 11.6155 10.0926 11.3518 11.5129 11.3483C11.8996 11.3483 12.3742 11.3659 12.5711 11.387C12.9191 11.4291 12.9262 11.4291 13.0914 11.5838C13.334 11.8088 13.5836 11.8932 13.9387 11.8756C14.3852 11.851 14.7051 11.6401 14.909 11.2428C15.0039 11.0565 15.0355 10.6838 14.9793 10.4553C14.9547 10.3604 14.5855 9.68187 14.0969 8.83461C13.6328 8.02953 13.2531 7.36156 13.2531 7.3475C13.2531 7.33343 13.3023 7.30179 13.3621 7.27718C13.5309 7.20687 13.8086 6.91156 13.907 6.70414C14.0934 6.29632 14.0898 5.87797 13.9 5.48773C13.5766 4.83031 12.7434 4.56312 12.0719 4.90414C11.9805 4.94984 11.8926 4.98148 11.882 4.97445C11.868 4.96742 11.4883 4.31351 11.0348 3.52601C10.525 2.63656 10.1594 2.04242 10.0715 1.95101C9.77617 1.65218 9.26992 1.53617 8.86914 1.68031Z"
            fill="var(--c-gold)"
          />
          <path
            d="M16.2592 3.44836C15.883 3.65227 14.8459 4.2675 14.7896 4.32023C14.6877 4.41867 14.6314 4.62609 14.6596 4.78781C14.7088 5.04094 14.983 5.2343 15.2361 5.18859C15.4014 5.15695 16.8006 4.34484 16.9377 4.2007C17.0326 4.09523 17.0502 4.05305 17.0502 3.90188C17.0502 3.80344 17.0256 3.67688 16.9975 3.61711C16.8744 3.38156 16.5334 3.30422 16.2592 3.44836Z"
            fill="var(--c-gold)"
          />
          <path
            d="M15.2257 6.88359C15.057 6.96797 14.9691 7.10156 14.9515 7.30195C14.9339 7.50234 15.0183 7.66055 15.1941 7.76953C15.3031 7.83633 15.3734 7.83984 16.305 7.83984C17.4054 7.83984 17.4476 7.83281 17.5777 7.61836C17.6656 7.47422 17.6691 7.20352 17.5882 7.06289C17.5531 7.00664 17.4617 6.9293 17.3843 6.89062C17.2507 6.82734 17.1628 6.82031 16.291 6.82031C15.4613 6.82031 15.3312 6.82734 15.2257 6.88359Z"
            fill="var(--c-gold)"
          />
          <path
            d="M2.37305 9.24284C1.43438 9.78425 1.32891 9.85456 1.05469 10.1288C0.5625 10.6139 0.351562 11.1237 0.351562 11.8479C0.351562 12.2733 0.407813 12.5264 0.576563 12.885C1.11094 14.0135 2.42227 14.5479 3.60352 14.119C3.72305 14.0768 4.28203 13.7745 4.84805 13.4475C5.63203 12.9975 5.87109 12.8428 5.86055 12.8007C5.82188 12.6706 3.48047 8.66628 3.43828 8.65925C3.41367 8.65573 2.93555 8.91589 2.37305 9.24284Z"
            fill="var(--c-gold)"
          />
          <path
            d="M5.52729 13.8127C5.13705 14.0412 4.79955 14.2416 4.78197 14.2592C4.73979 14.3014 6.55736 16.6779 6.7226 16.7939C6.85971 16.8959 7.10932 16.9029 7.26049 16.808C7.32025 16.7728 7.52064 16.5971 7.71049 16.4142L8.0515 16.0838V15.8869C8.0515 15.7181 8.03393 15.6619 7.939 15.5248C7.63666 15.0994 6.30775 13.3978 6.27611 13.3978C6.25854 13.3978 5.92104 13.5842 5.52729 13.8127Z"
            fill="var(--c-gold)"
          />
        </svg>
        <PageMarquee className="font-bangla text-ink-soft text-base leading-none">
          {notices.map((notice, index) => (
            <span key={index} className="w-max text-nowrap">
              {notice}
            </span>
          ))}
        </PageMarquee>
      </button>

      <div
        ref={categoryScrollerRef}
        className="mt-3 w-full overflow-x-auto hide-scrollbar"
      >
        <div className="relative flex min-w-max items-center border-b border-[color-mix(in_srgb,var(--c-gold)_25%,transparent)] px-[7.5px] py-2">
          {tabs.map((tab, index) => {
            const is_active_btn =
              active_tab.name.toLowerCase() === tab.name.toLowerCase();
            const path = tab.name.toLowerCase();
            return (
              <button
                type="button"
                data-selected={is_active_btn}
                ref={(node) => {
                  if (node) categoryTabRefs.current.set(path, node);
                  else categoryTabRefs.current.delete(path);
                }}
                className={`group relative h-16.5 w-[106.5px] shrink-0 cursor-pointer transition-opacity duration-200 focus:outline-none ${is_active_btn ? "opacity-100" : "opacity-50 hover:opacity-100"}`}
                aria-label={`Browse ${path === "casino" ? "Live" : tab.name} games`}
                onClick={() => navigate(`/${path}`)}
                key={index}
              >
                <img
                  src={category_pod_bg}
                  className="pointer-events-none absolute left-0 top-0 h-[58.95px] w-26.25"
                  alt=""
                  aria-hidden="true"
                />
                <span className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap font-extrabold uppercase leading-none text-primary2 transition-[font-size] delay-100 duration-500 group-data-[selected=true]:text-xl">
                  {tab.name}
                </span>
                <div className="pointer-events-none absolute bottom-0 left-[14.7px] h-[31.65px] w-[73.5px]">
                  <img
                    src={category_pod_bar}
                    className="block size-full object-fill"
                    alt=""
                    aria-hidden="true"
                  />
                </div>
                <CategoryIcon name={path} />
                {is_active_btn && (
                  <div className="pointer-events-none absolute -bottom-2 left-[calc(50%-36.5px)] h-0.5 w-[73.1px] bg-[linear-gradient(to_right,color-mix(in_srgb,var(--c-gold)_0%,transparent)_0%,var(--c-gold)_50%,color-mix(in_srgb,var(--c-gold)_0%,transparent)_100%)]" />
                )}
                {tab_icon_shape}
              </button>
            );
          })}
        </div>
      </div>

      {/* Swipe left/right to move between categories. Only the active slide and
          its neighbours render, so swiping stays smooth without mounting every list. */}
      <Swiper
        className="mt-3 w-full"
        initialSlide={activeIndex}
        autoHeight
        speed={350}
        // Ignore small and mostly-vertical drags so scrolling the page doesn't
        // wobble the panel sideways, and don't rubber-band past the ends.
        threshold={12}
        touchAngle={30}
        resistanceRatio={0}
        onSwiper={setSwiper}
        // Update the URL at low priority so it doesn't compete with the slide.
        onSlideChange={(instance) => {
          const path = tabs[instance.activeIndex].name.toLowerCase();
          if (path !== active_tab.name.toLowerCase()) {
            startTransition(() => navigate(`/${path}`, { replace: true }));
          }
        }}
        onSlideChangeTransitionEnd={(instance) => setSettledIndex(instance.activeIndex)}
        // Neighbouring tabs mount on the first touch, not during the first paint.
        onTouchStart={(instance) => setSettledIndex((current) => current ?? instance.activeIndex)}
      >
        {tabs.map((tab, index) => (
          <SwiperSlide key={tab.name}>
            <div>
              {index === activeIndex || (settledIndex !== null && Math.abs(index - settledIndex) <= 1) ? (
                <Suspense
                  fallback={
                    <div className="min-h-48 rounded-lg border border-line bg-surface p-6 text-center text-sm text-ink-muted">
                      Preparing games…
                    </div>
                  }
                >
                  {tab.component}
                </Suspense>
              ) : null}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <AnnouncementDrawer
        open={announcementsOpen}
        onClose={() => setAnnouncementsOpen(false)}
        notices={noticeItems}
      />
    </div>
  );
}
