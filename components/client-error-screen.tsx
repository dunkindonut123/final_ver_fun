"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ClientErrorScreenProps {
  staleDeployment?: boolean;
}

export function ClientErrorScreen({ staleDeployment = false }: ClientErrorScreenProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="max-w-md rounded-2xl border border-white/20 bg-background/85 shadow-xl shadow-foreground/10">
        <CardContent className="p-8 text-center">
          <h1 className="text-xl font-bold text-foreground">This page needs a refresh</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {staleDeployment
              ? "The app was updated. Reload to continue."
              : "Something went wrong while loading this page."}
          </p>
          <Button
            type="button"
            className="mt-6 min-h-11 rounded-xl bg-[#1e5fa8] text-white hover:bg-[#1a5292]"
            onClick={() => window.location.reload()}
          >
            Reload
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
