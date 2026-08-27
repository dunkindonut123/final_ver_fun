import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Fail fast instead of waiting for Vercel's ~25s middleware kill. */
const GET_USER_TIMEOUT_MS = 3_000;

/** Match auth-js EXPIRY_MARGIN_MS (3 ticks × 30s). Only refresh this close to expiry. */
const ACCESS_TOKEN_REFRESH_MARGIN_MS = 90_000;

const BASE64_PREFIX = "base64-";

function getAuthCookieName(): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  try {
    const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
    return projectRef ? `sb-${projectRef}-auth-token` : null;
  } catch {
    return null;
  }
}

function combineAuthCookie(request: NextRequest, name: string): string | null {
  const unchunked = request.cookies.get(name)?.value;
  if (unchunked) return unchunked;

  const parts: string[] = [];
  for (let i = 0; ; i += 1) {
    const chunk = request.cookies.get(`${name}.${i}`)?.value;
    if (!chunk) break;
    parts.push(chunk);
  }

  return parts.length > 0 ? parts.join("") : null;
}

function decodeBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  return atob(padded + "=".repeat(padLength));
}

function decodeJwtExpMs(accessToken: string): number | null {
  const payload = accessToken.split(".")[1];
  if (!payload) return null;

  try {
    const parsed = JSON.parse(decodeBase64Url(payload)) as { exp?: unknown };
    return typeof parsed.exp === "number" ? parsed.exp * 1000 : null;
  } catch {
    return null;
  }
}

function parseAccessTokenExpiresAtMs(raw: string): number | null {
  try {
    const decoded = raw.startsWith(BASE64_PREFIX)
      ? decodeBase64Url(raw.slice(BASE64_PREFIX.length))
      : raw;
    const session = JSON.parse(decoded) as {
      expires_at?: unknown;
      access_token?: unknown;
    };

    if (typeof session.expires_at === "number" && Number.isFinite(session.expires_at)) {
      return session.expires_at * 1000;
    }

    if (typeof session.access_token === "string") {
      return decodeJwtExpMs(session.access_token);
    }
  } catch {
    return null;
  }

  return null;
}

function needsSessionRefresh(request: NextRequest): boolean {
  const cookieName = getAuthCookieName();
  if (!cookieName) return true;

  const raw = combineAuthCookie(request, cookieName);
  if (!raw) return false;

  const expiresAtMs = parseAccessTokenExpiresAtMs(raw);
  if (expiresAtMs == null) return true;

  return expiresAtMs - Date.now() < ACCESS_TOKEN_REFRESH_MARGIN_MS;
}

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const timeout = AbortSignal.timeout(GET_USER_TIMEOUT_MS);
  const signal =
    init?.signal && typeof AbortSignal.any === "function"
      ? AbortSignal.any([init.signal, timeout])
      : timeout;

  return fetch(input, { ...init, signal });
}

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  // Skip Auth when the access token is still fresh so concurrent page + API
  // hits do not all refresh the same session (a known hang / 504 source).
  if (!needsSessionRefresh(request)) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: fetchWithTimeout,
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  try {
    await supabase.auth.getUser();
  } catch {
    // Timeout or Auth outage: continue with existing cookies. Page/API
    // handlers still call getUser() for authorization.
  }

  return response;
}
