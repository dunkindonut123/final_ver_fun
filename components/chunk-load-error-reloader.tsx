"use client";

import { useEffect } from "react";
import {
  isNextStaticAssetUrl,
  isStaleDeploymentError,
  reloadForStaleChunk,
} from "@/lib/reload-on-chunk-error";

function assetUrlFromEventTarget(target: EventTarget | null): string | null {
  if (target instanceof HTMLScriptElement) return target.src;
  if (target instanceof HTMLLinkElement) return target.href;
  return null;
}

/** Recovers from a stale tab after deploy by reloading once. */
export function ChunkLoadErrorReloader() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      const assetUrl = assetUrlFromEventTarget(event.target);
      if (
        isNextStaticAssetUrl(assetUrl) ||
        isStaleDeploymentError(event.error) ||
        isStaleDeploymentError(event.message)
      ) {
        event.preventDefault();
        reloadForStaleChunk();
      }
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      if (!isStaleDeploymentError(event.reason)) return;
      event.preventDefault();
      reloadForStaleChunk();
    };

    // Resource load failures (script/link) do not bubble; capture is required.
    window.addEventListener("error", onError, true);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError, true);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
