"use client";

import { useEffect } from "react";
import { ClientErrorScreen } from "@/components/client-error-screen";
import { isStaleDeploymentError, reloadForStaleChunk } from "@/lib/reload-on-chunk-error";

export default function Error({ error }: { error: Error & { digest?: string }; reset: () => void }) {
  const staleDeployment = isStaleDeploymentError(error);

  useEffect(() => {
    if (staleDeployment) {
      reloadForStaleChunk();
    }
  }, [staleDeployment]);

  return <ClientErrorScreen staleDeployment={staleDeployment} />;
}
