"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { HSK_LEVELS } from "@/lib/lms/hsk-levels";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Download, ExternalLink, Loader2, Trash2, Upload } from "lucide-react";

interface ChapterMaterialInfo {
  fileName: string;
  fileSizeBytes: number;
  updatedAt: string;
}

interface ChapterRow {
  id: string;
  title: string;
  hskLevel: number;
  chapterNumber: number;
  material: ChapterMaterialInfo | null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

export function AdminMaterialsContent() {
  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set([1]));
  const [uploadingChapterId, setUploadingChapterId] = useState<string | null>(null);
  const [deletingChapterId, setDeletingChapterId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const loadChapters = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/admin/chapter-materials");
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Failed to load chapters.");
      setChapters([]);
      setLoading(false);
      return;
    }

    setChapters(payload.chapters ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadChapters();
  }, [loadChapters]);

  const chaptersByLevel = useMemo(() => {
    const grouped = new Map<number, ChapterRow[]>();
    for (const level of HSK_LEVELS) {
      grouped.set(level, []);
    }
    for (const chapter of chapters) {
      const list = grouped.get(chapter.hskLevel) ?? [];
      list.push(chapter);
      grouped.set(chapter.hskLevel, list);
    }
    return grouped;
  }, [chapters]);

  const uploadedCount = useMemo(
    () => chapters.filter((chapter) => chapter.material).length,
    [chapters]
  );

  const toggleLevel = (level: number) => {
    setExpandedLevels((current) => {
      const next = new Set(current);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  const handleUpload = async (chapterId: string, file: File | null) => {
    if (!file) return;

    setUploadingChapterId(chapterId);
    setMessage(null);
    setError(null);

    const formData = new FormData();
    formData.append("chapterId", chapterId);
    formData.append("file", file);

    const response = await fetch("/api/admin/chapter-materials/upload", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();
    setUploadingChapterId(null);

    if (!response.ok) {
      setError(payload.error ?? "Upload failed.");
      return;
    }

    setMessage(`Uploaded ${payload.material.fileName} successfully.`);
    await loadChapters();
  };

  const handleDelete = async (chapterId: string) => {
    if (!window.confirm("Remove this chapter material? Students will no longer see it.")) {
      return;
    }

    setDeletingChapterId(chapterId);
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/admin/chapter-materials/${chapterId}`, {
      method: "DELETE",
    });
    const payload = await response.json();
    setDeletingChapterId(null);

    if (!response.ok) {
      setError(payload.error ?? "Delete failed.");
      return;
    }

    setMessage("Material removed.");
    await loadChapters();
  };

  return (
    <AdminShell
      title="Chapter Materials"
      description="Upload one PDF per chapter. Re-uploading replaces the existing file."
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Badge variant="outline" className="rounded-full">
          {uploadedCount} / {chapters.length} chapters have materials
        </Badge>
      </div>

      {message ? (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading chapters...
        </div>
      ) : (
        <div className="space-y-4">
          {HSK_LEVELS.map((level) => {
            const levelChapters = chaptersByLevel.get(level) ?? [];
            const levelUploaded = levelChapters.filter((chapter) => chapter.material).length;
            const expanded = expandedLevels.has(level);

            return (
              <Card key={level} className="rounded-2xl border border-white/20 bg-background/75">
                <button
                  type="button"
                  onClick={() => toggleLevel(level)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    {expanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-semibold text-foreground">HSK {level}</p>
                      <p className="text-sm text-muted-foreground">
                        {levelUploaded} of {levelChapters.length} chapters uploaded
                      </p>
                    </div>
                  </div>
                  <Badge className="rounded-full bg-[#1e5fa8] text-white">HSK {level}</Badge>
                </button>

                {expanded ? (
                  <CardContent className="space-y-3 border-t border-border/60 px-5 pb-5 pt-4">
                    {levelChapters.map((chapter) => {
                      const isUploading = uploadingChapterId === chapter.id;
                      const isDeleting = deletingChapterId === chapter.id;

                      return (
                        <div
                          key={chapter.id}
                          className="rounded-2xl border border-border/60 bg-muted/20 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">
                                Chapter {chapter.chapterNumber}
                              </p>
                              <h3 className="font-semibold text-foreground">{chapter.title}</h3>
                              <p className="mt-1 text-xs text-muted-foreground">{chapter.id}</p>
                              {chapter.material ? (
                                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                  <p>
                                    <span className="font-medium text-foreground">File:</span>{" "}
                                    {chapter.material.fileName}
                                  </p>
                                  <p>
                                    {formatBytes(chapter.material.fileSizeBytes)} · Updated{" "}
                                    {formatDate(chapter.material.updatedAt)}
                                  </p>
                                </div>
                              ) : (
                                <p className="mt-2 text-sm text-muted-foreground">No PDF uploaded yet.</p>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {chapter.material ? (
                                <>
                                  <Button asChild variant="outline" size="sm" className="rounded-xl">
                                    <a
                                      href={`/api/chapter-materials/${chapter.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <ExternalLink className="mr-2 h-4 w-4" />
                                      Preview
                                    </a>
                                  </Button>
                                  <Button asChild variant="outline" size="sm" className="rounded-xl">
                                    <a href={`/api/chapter-materials/${chapter.id}?download=1`}>
                                      <Download className="mr-2 h-4 w-4" />
                                      Download
                                    </a>
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl text-red-600 hover:text-red-700"
                                    disabled={isDeleting || isUploading}
                                    onClick={() => void handleDelete(chapter.id)}
                                  >
                                    {isDeleting ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </>
                              ) : null}

                              <Button
                                type="button"
                                size="sm"
                                className={cn(
                                  "rounded-xl",
                                  chapter.material
                                    ? "bg-muted text-foreground hover:bg-muted/80"
                                    : "bg-[#1e5fa8] text-white hover:bg-[#1a5292]"
                                )}
                                disabled={isUploading || isDeleting}
                                onClick={() => fileInputRefs.current[chapter.id]?.click()}
                              >
                                {isUploading ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Upload className="mr-2 h-4 w-4" />
                                )}
                                {chapter.material ? "Replace PDF" : "Upload PDF"}
                              </Button>
                            </div>
                          </div>

                          <input
                            ref={(node) => {
                              fileInputRefs.current[chapter.id] = node;
                            }}
                            type="file"
                            accept="application/pdf,.pdf"
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0] ?? null;
                              event.target.value = "";
                              void handleUpload(chapter.id, file);
                            }}
                          />
                        </div>
                      );
                    })}
                  </CardContent>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      <Card className="mt-6 rounded-2xl border border-dashed border-border/80 bg-muted/20">
        <CardContent className="space-y-2 p-5 text-sm text-muted-foreground">
          <Label>Upload guidelines</Label>
          <p>PDF only, up to 20 MB per chapter.</p>
          <p>Each chapter stores one file. Uploading again overwrites the previous PDF.</p>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
