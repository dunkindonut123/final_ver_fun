const RELOAD_AT_KEY = "fm-stale-chunk-reload-at";
const RELOAD_COOLDOWN_MS = 10_000;

let reloadInFlight = false;

function errorText(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name} ${error.message} ${error.stack ?? ""}`;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "";
}

/** Stale deploy: old client cannot load new JS chunks or the matching RSC payload. */
export function isStaleDeploymentError(error: unknown): boolean {
  const name = error instanceof Error ? error.name : "";
  const text = `${name} ${errorText(error)}`;

  return (
    name === "ChunkLoadError" ||
    /Loading chunk .+ failed/i.test(text) ||
    /Loading CSS chunk/i.test(text) ||
    /Failed to fetch dynamically imported module/i.test(text) ||
    /error loading dynamically imported module/i.test(text) ||
    /Importing a module script failed/i.test(text) ||
    /Unable to preload CSS/i.test(text) ||
    /Failed to load chunk/i.test(text) ||
    /Failed to fetch RSC payload/i.test(text) ||
    /unexpected response was received from the server/i.test(text) ||
    /\/_next\/static\//i.test(text)
  );
}

function recentlyReloaded(): boolean {
  try {
    const last = sessionStorage.getItem(RELOAD_AT_KEY);
    if (!last) return false;
    return Date.now() - Number(last) < RELOAD_COOLDOWN_MS;
  } catch {
    return false;
  }
}

function markReload(): void {
  try {
    sessionStorage.setItem(RELOAD_AT_KEY, String(Date.now()));
  } catch {
    // Private mode can block sessionStorage; module flag still prevents a tight loop.
  }
}

/** Full reload so the browser picks up the current deployment. Returns false if skipped. */
export function reloadForStaleChunk(): boolean {
  if (reloadInFlight || recentlyReloaded()) return false;
  reloadInFlight = true;
  markReload();
  window.location.reload();
  return true;
}

export function isNextStaticAssetUrl(url: string | null | undefined): boolean {
  return typeof url === "string" && url.includes("/_next/static/");
}
