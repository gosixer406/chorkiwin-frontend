import Loader from "@/components/loader";
import { useEffect, useState } from "react";
import { CURRENT_BETS_POLL_MS, startPolling } from "@/lib/polling";
import PageTitle from "../../components/dashboard/page-title";
import CommonInner from "../../layout/dashboard/common-inner";
import { api } from "../../lib/api";
import { formatMoney } from "../../lib/currency";
import { requestAccountRefresh } from "../../lib/refresh-account";

const betTabs = [
  { name: "Exchange", source: "exchange", category: "exchange" },
  { name: "BookMaker", source: "exchange", category: "bookmaker" },
  { name: "Fancybet", source: "exchange", category: "fancy" },
  { name: "Sportsbook", source: "exchange", category: "sportsbook" },
];

const statusStyles = {
  won: "bg-[#F2F6F8] text-[#16833B]",
  lost: "bg-[#F5F8F9] text-[#C52B2B]",
  pending: "bg-[#FFF3CC] text-[#8A6400]",
  void: "bg-[#F2F6F8] text-ink-dim",
  settled: "bg-[#F2F6F8] text-[#16833B]",
};

// Same statuses tinted for the themed (dark) shell.
const darkStatusStyles = {
  won: "bg-[#16833B]/20 text-[#5BD69E]",
  lost: "bg-[#C52B2B]/20 text-[#FF7A84]",
  pending: "bg-gold/15 text-gold",
  void: "bg-ink-muted/15 text-ink-soft",
  settled: "bg-[#16833B]/20 text-[#5BD69E]",
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const rowSearchText = (row) => {
  const selections = Array.isArray(row.selections) ? row.selections : [];
  return [
    row.source,
    row.provider,
    row.bet_type,
    row.market,
    row.event_name,
    ...selections.flatMap((selection) => [
      selection.market_name,
      selection.event_name,
      selection.sport,
    ]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

const filterRowsForTab = (rows, category) => {
  if (!category) return rows;
  const normalizedCategory = category === "premium" ? "sportsbook" : category;
  const explicitlyClassified = rows.filter(
    (row) => row.category || row.channel,
  );
  if (explicitlyClassified.length > 0) {
    return rows.filter(
      (row) =>
        String(row.category || row.channel || "").toLowerCase() ===
        normalizedCategory,
    );
  }
  if (category === "exchange") {
    return rows.filter((row) => {
      const text = rowSearchText(row);
      return (
        text.includes("9wicket") ||
        String(row.source || "").toLowerCase() === "exchange"
      );
    });
  }
  if (category === "bookmaker") {
    return rows.filter((row) => /book\s*-?\s*maker/.test(rowSearchText(row)));
  }
  if (category === "fancy") {
    return rows.filter((row) => rowSearchText(row).includes("fancy"));
  }
  return rows.filter((row) => {
    const text = rowSearchText(row);
    return (
      text.includes("premium") ||
      (!text.includes("fancy") && !/book\s*-?\s*maker/.test(text))
    );
  });
};

function BetRecordRow({ row, index, dark = false }) {
  const firstSelection = Array.isArray(row.selections)
    ? row.selections[0]
    : null;
  const eventName =
    row.event_name || firstSelection?.event_name || row.market || "Sports bet";
  const marketName =
    row.market || firstSelection?.market_name || row.sport || "";
  const selectionName = row.selection || firstSelection?.selection_name || "";
  const odds = row.total_odds ?? firstSelection?.odds;
  const stake = row.stake ?? row.bet_amount ?? 0;
  const won = row.won ?? row.actual_win ?? 0;
  const potentialWin = row.potential_win;
  const status = String(row.status || "settled").toLowerCase();
  const exposure = row.exposure ?? (status === "pending" ? stake : 0);
  const placedAt = row.placed || row.created_at || row.settled;
  const context = [row.provider || row.source, row.sport, row.league]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      className={`${dark ? "rounded-md border border-line bg-surface px-3.5 py-3 text-ink" : "rounded-lg border px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border-ink-muted bg-white text-black"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <strong className="block truncate text-sm leading-normal">
            {eventName}
          </strong>
          {context && (
            <p
              className={`mt-1 truncate text-[11px] leading-normal ${dark ? "text-ink-muted" : "text-ink-muted"}`}
            >
              {context}
            </p>
          )}
          {(marketName || selectionName) && (
            <p
              className={`mt-1 text-xs leading-normal ${dark ? "text-ink-soft" : "text-ink-dim"}`}
            >
              {[marketName, selectionName].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${(dark ? darkStatusStyles : statusStyles)[status] || (dark ? darkStatusStyles : statusStyles).void}`}
        >
          {status}
        </span>
      </div>
      <div
        className={`mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-3 text-xs sm:grid-cols-5 ${dark ? "border-line" : "border-[#F1F5F7]"}`}
      >
        <span className={dark ? "text-ink-soft" : "text-ink-dim"}>
          Stake
          <strong
            className={`mt-0.5 block ${dark ? "text-white" : "text-black"}`}
          >
            {formatMoney(stake)}
          </strong>
        </span>
        <span className={dark ? "text-ink-soft" : "text-ink-dim"}>
          Exposure
          <strong
            className={`mt-0.5 block ${dark ? "text-white" : "text-black"}`}
          >
            {formatMoney(exposure)}
          </strong>
        </span>
        {odds !== null && odds !== undefined && odds !== "" && (
          <span className={dark ? "text-ink-soft" : "text-ink-dim"}>
            Odds
            <strong
              className={`mt-0.5 block ${dark ? "text-white" : "text-black"}`}
            >
              {Number(odds).toFixed(2)}
            </strong>
          </span>
        )}
        <span className={dark ? "text-ink-soft" : "text-ink-dim"}>
          {potentialWin !== null && potentialWin !== undefined
            ? "Potential win"
            : "Won"}
          <strong
            className={`mt-0.5 block ${dark ? "text-white" : "text-black"}`}
          >
            {formatMoney(potentialWin ?? won)}
          </strong>
        </span>
        <span className={dark ? "text-ink-soft" : "text-ink-dim"}>
          Placed
          <strong
            className={`mt-0.5 block ${dark ? "text-white" : "text-black"}`}
          >
            {formatDate(placedAt)}
          </strong>
        </span>
      </div>
      {(row.reference_id || row.id) && (
        <p
          className={`mt-2 truncate text-[10px] ${dark ? "text-ink-muted" : "text-ink-muted"}`}
        >
          Bet ID: {row.reference_id || row.id || index + 1}
        </p>
      )}
    </article>
  );
}

export default function CurrentBets({ history = false, dark = false }) {
  const [active_btn, set_active_btn] = useState(betTabs[0]);
  const [reload, setReload] = useState(0);
  const [recordsState, setRecordsState] = useState({
    loading: true,
    error: "",
    rows: [],
  });

  useEffect(() => {
    let active = true;
    let controller = null;
    let inFlight = false;
    let previousSignature = null;
    let path;

    if (history) {
      const query = new URLSearchParams({
        source: active_btn.source,
        category: active_btn.category,
        limit: "100",
      });
      path = `/api/betting/history?${query.toString()}`;
    } else {
      const query = new URLSearchParams({
        category: active_btn.category,
      });
      path = `/api/sports/current-bets?${query.toString()}`;
    }

    const loadRecords = async (showLoading = false) => {
      if (!active || inFlight) return;
      inFlight = true;
      controller = new AbortController();
      if (showLoading) {
        setRecordsState({ loading: true, error: "", rows: [] });
      }

      try {
        const response = await api.get(path, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!active || controller.signal.aborted) return;
        const rows = Array.isArray(response.data) ? response.data : [];
        const filteredRows = filterRowsForTab(rows, active_btn.category);
        const signature = filteredRows
          .map(
            (row, index) =>
              `${row.id || row.reference_id || index}:${row.category || row.channel || ""}:${row.status || "pending"}:${row.stake || 0}:${row.won || 0}`,
          )
          .sort()
          .join("|");

        // A removed/settled ticket means the header's exposure is now
        // stale too. Refresh the shared account as soon as the polling
        // response changes instead of waiting for a page reload.
        if (
          !history &&
          previousSignature !== null &&
          signature !== previousSignature
        ) {
          requestAccountRefresh();
        }
        previousSignature = signature;
        setRecordsState({
          loading: false,
          error: "",
          rows: filteredRows,
        });
      } catch (requestError) {
        if (!active || controller.signal.aborted) return;
        setRecordsState((current) => ({
          loading: false,
          error: requestError.message,
          rows: showLoading ? [] : current.rows,
        }));
      } finally {
        inFlight = false;
        controller = null;
      }
    };

    loadRecords(true);
    const poller = startPolling(() => loadRecords(false), CURRENT_BETS_POLL_MS);

    return () => {
      active = false;
      controller?.abort();
      poller.stop();
    };
  }, [active_btn, history, reload]);

  const selectTab = (item) => {
    set_active_btn(item);
    if (item.name !== active_btn.name) {
      setRecordsState({ loading: true, error: "", rows: [] });
    }
  };

  return (
    <>
      <PageTitle
        title={history ? "Bets History" : "Current Bets"}
        titleClass={
          dark
            ? "font-poppins text-[15px] font-bold tracking-tight"
            : "text-lg font-[800]"
        }
        className={dark ? "min-h-[51px]! bg-bar px-3! text-ink" : undefined}
      />
      <CommonInner
        className={`px-0! ${dark ? "rounded-none! bg-page! pt-0! text-ink" : ""}`}
      >
        <div
          className={`flex items-center justify-start gap-6 overflow-auto md:overflow-x-auto ${dark ? "border-b border-line bg-bar px-[13px]" : "px-8"}`}
        >
          {betTabs.map((item) => (
            <button
              onClick={() => selectTab(item)}
              className={`flex w-max text-nowrap items-center justify-center min-h-11 border-b-2 border-solid leading-normal ${dark ? "font-poppins text-sm font-semibold" : "text-base font-bold text-black"} ${active_btn.name === item.name ? (dark ? "border-gold text-gold" : "border-black") : dark ? "border-transparent text-ink-soft hover:text-ink" : "border-transparent"}`}
              key={item.name}
            >
              {item.name}
            </button>
          ))}
        </div>
        <div
          className={`flex items-center justify-between py-2 text-xs ${dark ? "border-b border-line px-[13px] text-ink-muted" : "border-y px-4"} ${dark ? "" : "border-ink-muted text-ink-dim"}`}
        >
          <span aria-live="polite">
            {history ? "Bet records" : "Current bets update automatically"}
          </span>
          <button
            type="button"
            disabled={recordsState.loading}
            onClick={() => setReload((value) => value + 1)}
            className={`py-1 font-bold disabled:opacity-50 ${dark ? "rounded-[5px] px-3 bg-linear-to-b from-gold-light to-gold-dark text-on-gold" : "rounded px-3 bg-primary text-black"}`}
          >
            Refresh
          </button>
        </div>
        {recordsState.loading && (
          <Loader />
        )}
        {!recordsState.loading && recordsState.error && (
          <p
            className={`mx-4 mt-8 rounded-lg border px-4 py-3 text-center text-sm ${dark ? "border-[#772C2C] bg-[#C52B2B]/10 text-[#FF7A84]" : "border-[#F0CACA] bg-[#F5F8F9] text-[#B42318]"}`}
          >
            {recordsState.error}
          </p>
        )}
        {!recordsState.loading &&
          !recordsState.error &&
          recordsState.rows.length === 0 && (
            <p className={`mt-18 text-center ${dark ? "text-ink-muted" : ""}`}>
              No {history ? "bet history" : "current bets"} to show
            </p>
          )}
        {!recordsState.loading &&
          !recordsState.error &&
          recordsState.rows.length > 0 && (
            <div
              className={`space-y-2 pb-6 pt-3 ${dark ? "px-[13px]" : "px-4"}`}
            >
              {recordsState.rows.map((row, index) => (
                <BetRecordRow
                  key={row.id || row.reference_id || index}
                  row={row}
                  index={index}
                  dark={dark}
                />
              ))}
            </div>
          )}
      </CommonInner>
    </>
  );
}
