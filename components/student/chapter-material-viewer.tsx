"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ChapterMaterialViewerProps {
  chapterId: string;
  fileName: string;
}

export function ChapterMaterialViewer({ chapterId, fileName }: ChapterMaterialViewerProps) {
  const viewUrl = `/api/chapter-materials/${chapterId}`;
  const downloadUrl = `/api/chapter-materials/${chapterId}?download=1`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-foreground">Chapter materials</h2>
          <p className="truncate text-sm text-muted-foreground">{fileName}</p>
        </div>
        <Button asChild variant="outline" className="rounded-xl">
          <a href={downloadUrl} download={fileName}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </a>
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/20">
        <iframe
          src={viewUrl}
          title={`Chapter materials: ${fileName}`}
          className="h-[min(70vh,720px)] w-full bg-white"
        />
      </div>
    </div>
  );
}
