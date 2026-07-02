import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface QuestionsUnavailableProps {
  returnHref?: string;
  compact?: boolean;
}

export function QuestionsUnavailable({ returnHref, compact = false }: QuestionsUnavailableProps) {
  const content = (
    <>
      <h1 className={compact ? "text-lg font-bold" : "text-xl font-bold"}>Questions not available yet</h1>
      <p className="mt-2 text-muted-foreground">Check back later or ask your teacher.</p>
      {returnHref ? (
        <Button asChild className="mt-6 rounded-xl">
          <Link href={returnHref}>Go back</Link>
        </Button>
      ) : null}
    </>
  );

  if (compact) {
    return <div className="rounded-xl border bg-muted/30 p-6 text-center">{content}</div>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md rounded-2xl">
        <CardContent className="p-8 text-center">{content}</CardContent>
      </Card>
    </main>
  );
}
