import { api } from "@/lib/api";

const EXCHANGE_ACTIVE_KEY = "velki_exchange_active";
const EXCHANGE_EXITED_KEY = "velki_exchange_exit_observed";
const EXCHANGE_WALLET_SNAPSHOT_KEY = "velki_exchange_wallet_snapshot";
const EXCHANGE_RELAUNCH_AFTER_KEY = "velki_exchange_relaunch_after";
const EXCHANGE_RETURN_PATH_KEY = "velki_exchange_return_path";
const EXCHANGE_TRANSFER_KEY = "velki_exchange_transfer_id";
const EXCHANGE_TAB_TRANSFER_KEY = "velki_exchange_tab_transfer_id";
const EXCHANGE_LEGACY_COLLECT_KEY = "velki_exchange_legacy_collect";
const NINE_WICKET_TRANSFER_PREFIX = "NWD-";
let exchangeCollectRequest = null;
let exchangeGameTab = null;
let exchangeTabWatcher = null;
let exchangeGameTabTransferred = false;

export const ACCOUNT_REFRESH_EVENT = "velki:refresh-account";
export const EXCHANGE_EXIT_CHANNEL = "velki:exchange-exit";

export function rememberExchangeReturnPath(path) {
  localStorage.setItem(EXCHANGE_RETURN_PATH_KEY, String(path || "/sports"));
}

export function exchangeReturnPath() {
  return localStorage.getItem(EXCHANGE_RETURN_PATH_KEY) || "/sports";
}

export function requestAccountRefresh({ collectExchange = false } = {}) {
  window.dispatchEvent(
    new CustomEvent(ACCOUNT_REFRESH_EVENT, { detail: { collectExchange } }),
  );
}

export function exchangeExitObserved() {
  return localStorage.getItem(EXCHANGE_EXITED_KEY) === "1";
}

export function markExchangeExitObserved({ notify = true } = {}) {
  // The game tab is an explicit exit signal even when browser storage was
  // cleared while the provider held the balance.
  localStorage.setItem(EXCHANGE_EXITED_KEY, "1");
  if (notify) requestAccountRefresh({ collectExchange: true });
}

export function isExchangeGameTabOpen() {
  // A fast second click can happen before the one-second close watcher runs.
  // Observe the closed tab now so the return path is durable during relaunch.
  if (exchangeGameTab?.closed) {
    const transferred =
      exchangeGameTabTransferred ||
      localStorage.getItem(EXCHANGE_ACTIVE_KEY) === "1";
    finishExchangeGameTab();
    if (transferred) markExchangeExitObserved();
    return false;
  }
  try {
    if (
      exchangeGameTab &&
      exchangeGameTab.location.href !== "about:blank" &&
      exchangeGameTab.location.origin === window.location.origin &&
      exchangeGameTab.location.pathname !== "/9w-return"
    ) {
      finishExchangeGameTab();
    }
  } catch {
    /* The live provider tab is cross-origin. */
  }
  return !!exchangeGameTab && !exchangeGameTab.closed;
}

/**
 * The player came back to the site while 9 Wickets was open in its own tab:
 * that tab is closed (it was opened by this page, so the page may close it) and
 * the exit is recorded so the balance is collected from the provider.
 */
export function endExchangeOnReturn() {
  if (localStorage.getItem(EXCHANGE_ACTIVE_KEY) !== "1") return false;
  try {
    if (exchangeGameTab && !exchangeGameTab.closed) exchangeGameTab.close();
  } catch {
    /* Already gone, or the browser refused: the collection below still runs. */
  }
  finishExchangeGameTab();
  markExchangeExitObserved({ notify: false });
  return true;
}

export function finishExchangeGameTab() {
  if (exchangeTabWatcher) window.clearInterval(exchangeTabWatcher);
  exchangeTabWatcher = null;
  exchangeGameTab = null;
  exchangeGameTabTransferred = false;
}

export function watchExchangeGameTab(tab) {
  exchangeGameTab = tab;
  exchangeGameTabTransferred = false;
  if (exchangeTabWatcher) window.clearInterval(exchangeTabWatcher);
  exchangeTabWatcher = window.setInterval(() => {
    if (!tab.closed || document.visibilityState !== "visible") return;
    window.clearInterval(exchangeTabWatcher);
    exchangeTabWatcher = null;
    const transferred =
      exchangeGameTabTransferred ||
      localStorage.getItem(EXCHANGE_ACTIVE_KEY) === "1";
    if (exchangeGameTab === tab) exchangeGameTab = null;
    exchangeGameTabTransferred = false;
    if (transferred) markExchangeExitObserved();
  }, 1000);
}

function numericBalance(wallet) {
  const value = Number(
    wallet?.available ?? wallet?.main_balance ?? wallet?.balance,
  );
  return Number.isFinite(value) ? value : 0;
}

export function rememberExchangeWallet(wallet, transferId, gameTab = null) {
  localStorage.setItem(EXCHANGE_ACTIVE_KEY, "1");
  if (transferId) {
    localStorage.setItem(EXCHANGE_TRANSFER_KEY, String(transferId));
    // This tab keeps its own launch identity while visiting the provider.
    // An old return tab must never collect a newer game session.
    try {
      gameTab?.sessionStorage.setItem(
        EXCHANGE_TAB_TRANSFER_KEY,
        String(transferId),
      );
    } catch {
      /* Browser may isolate the popup. */
    }
  }
  exchangeGameTabTransferred = true;
  localStorage.removeItem(EXCHANGE_EXITED_KEY);
  localStorage.setItem(
    EXCHANGE_WALLET_SNAPSHOT_KEY,
    JSON.stringify(wallet || {}),
  );
}

export function readExchangeWalletSnapshot() {
  try {
    return JSON.parse(
      localStorage.getItem(EXCHANGE_WALLET_SNAPSHOT_KEY) || "null",
    );
  } catch {
    return null;
  }
}

export function exchangeTabTransferId() {
  try {
    return sessionStorage.getItem(EXCHANGE_TAB_TRANSFER_KEY) || "";
  } catch {
    return "";
  }
}

export function isCurrentExchangeTransfer(transferId) {
  const currentTransferId = localStorage.getItem(EXCHANGE_TRANSFER_KEY) || "";
  return transferId ? currentTransferId === transferId : !currentTransferId;
}

function clearExchangeMarkers() {
  localStorage.removeItem(EXCHANGE_ACTIVE_KEY);
  localStorage.removeItem(EXCHANGE_EXITED_KEY);
  localStorage.removeItem(EXCHANGE_WALLET_SNAPSHOT_KEY);
  localStorage.removeItem(EXCHANGE_TRANSFER_KEY);
}

// The server tracks 9Wicket money itself, but an old V3 session is retried only
// from the browser, so its id is kept after it stops blocking new launches.
function parkUnfinishedExchange() {
  const transferId = localStorage.getItem(EXCHANGE_TRANSFER_KEY) || "";
  if (!transferId.startsWith(NINE_WICKET_TRANSFER_PREFIX)) {
    localStorage.setItem(EXCHANGE_LEGACY_COLLECT_KEY, transferId || "latest");
  }
  clearExchangeMarkers();
}

function retryParkedLegacyCollect() {
  const saved = localStorage.getItem(EXCHANGE_LEGACY_COLLECT_KEY);
  if (!saved) return;
  api
    .post("/api/sports/collect", saved === "latest" ? {} : { transfer_id: saved })
    .then((response) => {
      const note = String(response.data?.note || "").toLowerCase();
      if (!note.includes("already in progress")) {
        localStorage.removeItem(EXCHANGE_LEGACY_COLLECT_KEY);
      }
    })
    .catch(() => {
      /* Stays saved and is retried on the next launch. */
    });
}

export async function collectActiveExchange({
  attempts = 3,
  force = false,
  transferId = "",
  strictSession = false,
} = {}) {
  const currentTransferId = localStorage.getItem(EXCHANGE_TRANSFER_KEY) || "";
  const targetTransferId = transferId || currentTransferId;
  if (strictSession && !transferId && currentTransferId) {
    return { active: false, settled: true, stale: true };
  }
  if (transferId && transferId !== currentTransferId) {
    return { active: false, settled: true, stale: true };
  }
  if (!force && localStorage.getItem(EXCHANGE_ACTIVE_KEY) !== "1") {
    return { active: false, settled: true };
  }
  if (targetTransferId && localStorage.getItem(EXCHANGE_ACTIVE_KEY) !== "1") {
    clearExchangeMarkers();
    return { active: false, settled: true, stale: true };
  }
  if (exchangeCollectRequest) return exchangeCollectRequest;

  exchangeCollectRequest = (async () => {
    let lastError = null;
    const delays = [0, 2100, 2100, 2100];
    for (let index = 0; index < Math.min(attempts, delays.length); index += 1) {
      if (delays[index]) {
        await new Promise((resolve) =>
          window.setTimeout(resolve, delays[index]),
        );
      }
      try {
        if (
          targetTransferId &&
          localStorage.getItem(EXCHANGE_TRANSFER_KEY) !== targetTransferId
        ) {
          return { active: false, settled: true, stale: true };
        }
        // A session opened before the Merchant API switch still has its
        // balance with the old provider, so it must collect from there.
        const collectPath = targetTransferId.startsWith("NWD-")
          ? "/api/9wicket/collect"
          : "/api/sports/collect";
        const response = await api.post(
          collectPath,
          targetTransferId ? { transfer_id: targetTransferId } : {},
        );
        const note = String(
          response.data?.note || response.message || "",
        ).toLowerCase();
        if (note.includes("already in progress")) continue;
        if (response.data?.stale_session) {
          clearExchangeMarkers();
          return { active: false, settled: true, stale: true };
        }
        const relaunchDelay = Math.max(
          0,
          Number(response.data?.relaunch_after_ms || 2500),
        );
        if (
          !targetTransferId ||
          localStorage.getItem(EXCHANGE_TRANSFER_KEY) === targetTransferId
        ) {
          localStorage.setItem(
            EXCHANGE_RELAUNCH_AFTER_KEY,
            String(Date.now() + relaunchDelay),
          );
          clearExchangeMarkers();
        }
        return { active: true, settled: true, response };
      } catch (error) {
        lastError = error;
      }
    }
    return { active: true, settled: false, error: lastError };
  })().finally(() => {
    exchangeCollectRequest = null;
  });

  return exchangeCollectRequest;
}

export async function waitForExchangeRelaunch() {
  retryParkedLegacyCollect();
  // An explicit new launch first retrieves any previous transfer. Ordinary
  // site focus and refresh never do this while the provider tab is open.
  if (
    !exchangeCollectRequest &&
    (localStorage.getItem(EXCHANGE_ACTIVE_KEY) === "1" ||
      exchangeExitObserved())
  ) {
    await collectActiveExchange({ force: true });
  }
  if (exchangeCollectRequest) {
    await exchangeCollectRequest;
  }
  // A new 9Wicket launch only adds to the player's wallet there, so a collection
  // that could not finish must not lock the player out.
  if (
    localStorage.getItem(EXCHANGE_ACTIVE_KEY) === "1" ||
    exchangeExitObserved()
  ) {
    parkUnfinishedExchange();
  }
  const relaunchAfter = Number(
    localStorage.getItem(EXCHANGE_RELAUNCH_AFTER_KEY) || 0,
  );
  const delay = Math.max(0, relaunchAfter - Date.now());
  if (delay) await new Promise((resolve) => window.setTimeout(resolve, delay));
  localStorage.removeItem(EXCHANGE_RELAUNCH_AFTER_KEY);
}

export async function fetchFreshAccount({
  liveExposure = true,
  preserveWallet = null,
} = {}) {
  // /auth/me can settle account bonuses. Read the wallet afterwards so the
  // balance and exposure always represent the final committed state.
  const accountResponse = await api.get("/api/auth/me", { cache: "no-store" });
  const walletPath = liveExposure
    ? "/api/wallet/balance?live_exposure=1"
    : "/api/wallet/balance";
  const walletResponse = await api.get(walletPath, { cache: "no-store" });
  const account = accountResponse.data || {};

  const freshWallet = {
    ...(account.wallet || {}),
    ...(walletResponse.data || {}),
  };
  const preserveTransientZero =
    preserveWallet &&
    numericBalance(preserveWallet) > 0 &&
    numericBalance(freshWallet) === 0;

  return {
    ...account,
    wallet: {
      ...freshWallet,
      ...(preserveTransientZero
        ? {
            main_balance:
              preserveWallet.main_balance ??
              preserveWallet.available ??
              freshWallet.main_balance,
            available:
              preserveWallet.available ??
              preserveWallet.main_balance ??
              freshWallet.available,
            balance: preserveWallet.balance ?? freshWallet.balance,
            bonus_balance:
              preserveWallet.bonus_balance ?? freshWallet.bonus_balance,
            balance_syncing: true,
          }
        : { balance_syncing: false }),
    },
  };
}
