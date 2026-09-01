"use client";

import { useEffect } from "react";
import { ClientErrorScreen } from "@/components/client-error-screen";
import { isStaleDeploymentError, reloadForStaleChunk } from "@/lib/reload-on-chunk-error";
import "./globals.css";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const staleDeployment = isStaleDeploymentError(error);

  useEffect(() => {
    if (staleDeployment) {
      reloadForStaleChunk();
    }
  }, [staleDeployment]);

  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <ClientErrorScreen staleDeployment={staleDeployment} />
      </body>
    </html>
  );
}
