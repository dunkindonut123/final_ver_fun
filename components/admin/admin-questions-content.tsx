"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  ASSIGNMENT_KEYS,
  assignmentACountLegend,
  assignmentCsvTemplate,
  validateQuestionCsv,
} from "@/lib/lms/assignment-questions";
import { chapterCountLegend } from "@/lib/lms/hsk-chapters";
import { parseCsv } from "@/lib/lms/csv-parser";
import { Download, Loader2, Upload, Volume2 } from "lucide-react";

const AUDIO_ENDPOINT = "/api/admin/questions/generate-audio";

interface CsvValidationError {
  row: number;
  field?: string;
  message: string;
  locator?: string;
  searchText?: string;
}

interface AudioStatus {
  total: number;
  missing: number;
  perLevel: { hskLevel: number; missing: number }[];
  configured: boolean;
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function AdminQuestionsContent() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<CsvValidationError[]>([]);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioStatus, setAudioStatus] = useState<AudioStatus | null>(null);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [audioMessage, setAudioMessage] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  const previewRows = useMemo(() => preview.slice(0, 10), [preview]);

  const loadAudioStatus = useCallback(async () => {
    const response = await fetch(AUDIO_ENDPOINT);
    const payload = await response.json();

    if (!response.ok) {
      setAudioError(payload.error ?? "Could not load audio coverage.");
      return;
    }

    setAudioStatus(payload as AudioStatus);
  }, []);

  useEffect(() => {
    void loadAudioStatus();
  }, [loadAudioStatus]);

  /** Each call handles a bounded batch, so loop until nothing is missing. */
  const handleGenerateAudio = async () => {
    setGeneratingAudio(true);
    setAudioError(null);
    setAudioMessage(null);

    let generated = 0;
    let reused = 0;
    let failed = 0;

    try {
      for (;;) {
        const response = await fetch(AUDIO_ENDPOINT, { method: "POST" });
        const payload = await response.json();

        if (!response.ok) {
          setAudioError(payload.error ?? "Audio generation failed.");
          break;
        }

        generated += payload.generated ?? 0;
        reused += payload.reused ?? 0;
        failed += payload.failed ?? 0;

        if (payload.remaining === 0) {
          setAudioMessage(
            `Done. Generated ${generated}, reused ${reused}${failed > 0 ? `, ${failed} failed` : ""}.`
          );
          break;
        }

        // Nothing succeeded in that batch: stop instead of looping forever.
        if ((payload.generated ?? 0) + (payload.reused ?? 0) === 0) {
          setAudioError(payload.errors?.[0] ?? "The last batch made no progress.");
          break;
        }

        setAudioMessage(
          `Generated ${generated}, reused ${reused}. ${payload.remaining} remaining...`
        );
      }
    } catch (requestError) {
      setAudioError(
        requestError instanceof Error ? requestError.message : "Audio generation failed."
      );
    } finally {
      setGeneratingAudio(false);
      await loadAudioStatus();
    }
  };

  const handleFileChange = async (nextFile: File | null) => {
    setFile(nextFile);
    setMessage(null);
    setError(null);
    setValidationErrors([]);

    if (!nextFile) {
      setPreview([]);
      setHeaders([]);
      return;
    }

    const text = await nextFile.text();
    const parsed = parseCsv(text);
    setHeaders(parsed.headers);
    setPreview(parsed.rows.map((row) => row.values));

    const validation = validateQuestionCsv(parsed.headers, parsed.rows);
    setValidationErrors(validation.errors);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setMessage(null);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/questions/import", {
      method: "POST",
      body: formData,
    });

    const payload = await response.json();
    setImporting(false);

    if (!response.ok) {
      if (payload.errors?.length) {
        setValidationErrors(payload.errors);
      }
      setError(payload.error ?? "Import failed.");
      return;
    }

    setMessage(
      `Imported ${payload.imported} question(s) across ${payload.assignmentsReplaced} assignment(s).`
    );
    setValidationErrors([]);
  };

  const handleTemplateDownload = () => {
    downloadTextFile("questions-template.csv", assignmentCsvTemplate());
  };

  const canImport = file && validationErrors.length === 0 && preview.length > 0;

  return (
    <>
      <AdminPageHeader
      title="Assignment Questions"
      description="Upload CSV files to manage per-chapter assignment question content."
    />
      <div className="mb-6 flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => handleTemplateDownload()}
        >
          <Download className="mr-2 h-4 w-4" />
          CSV template
        </Button>
      </div>

      <Card className="rounded-2xl border border-white/20 bg-background/75 shadow-lg shadow-foreground/5">
        <CardContent className="space-y-5 p-5">
          <div className="space-y-2">
            <Label htmlFor="questions-csv">CSV file</Label>
            <Input
              id="questions-csv"
              type="file"
              accept=".csv,text/csv"
              className="rounded-xl"
              onChange={(event) => void handleFileChange(event.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              Re-uploading rows for the same chapter and assignment replaces all existing questions for that
              assignment only. Assignment A and B are independent — uploading A does not change B, and uploading B
              does not change A. Assignment A requires pinyin_hint and meaning_hint; B only requires the hanzi answer.
              Chapters: {chapterCountLegend()}. Per-level slots: {assignmentACountLegend()}. Supported keys:{" "}
              {ASSIGNMENT_KEYS.join(", ")}.
            </p>
          </div>

          {headers.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">
                Preview ({preview.length} row{preview.length === 1 ? "" : "s"})
              </p>
              <div className="overflow-x-auto rounded-xl border">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {headers.map((header) => (
                        <th key={header} className="px-3 py-2 font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, index) => (
                      <tr key={index} className="border-t">
                        {headers.map((header) => (
                          <td key={header} className="px-3 py-2 text-muted-foreground">
                            {row[header]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.length > 10 ? (
                <p className="mt-2 text-xs text-muted-foreground">Showing first 10 rows.</p>
              ) : null}
            </div>
          ) : null}

          {validationErrors.length > 0 ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="mb-2 text-sm font-medium text-red-800">Validation errors</p>
              <ul className="space-y-1 text-sm text-red-700">
                {validationErrors.map((item, index) => (
                  <li key={`${item.row}-${item.field ?? "general"}-${index}`}>
                    {item.locator ?? `Row ${item.row}`}
                    {item.field ? ` (${item.field})` : ""}: {item.message}
                    {item.searchText ? ` Find in Excel: ${item.searchText}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

          <Button
            type="button"
            className="rounded-xl bg-[#1e5fa8] text-white hover:bg-[#1a5292]"
            disabled={!canImport || importing}
            onClick={() => void handleImport()}
          >
            {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Import questions
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-2xl border border-white/20 bg-background/75 shadow-lg shadow-foreground/5">
        <CardContent className="space-y-4 p-5">
          <div>
            <p className="text-sm font-medium text-foreground">Pronunciation audio</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Assignment A answers are synthesized once with Google Cloud TTS and stored, so every student hears the
              same audio. Questions without a file fall back to the student device&apos;s own voice. Run this after every
              CSV import.
            </p>
          </div>

          {audioStatus ? (
            <div className="space-y-2">
              <p className="text-sm text-foreground">
                {audioStatus.missing === 0
                  ? `All ${audioStatus.total} Assignment A question(s) have audio.`
                  : `${audioStatus.missing} of ${audioStatus.total} Assignment A question(s) are missing audio.`}
              </p>
              {audioStatus.perLevel.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Missing by level:{" "}
                  {audioStatus.perLevel
                    .map((entry) => `HSK ${entry.hskLevel} (${entry.missing})`)
                    .join(", ")}
                </p>
              ) : null}
              {!audioStatus.configured ? (
                <p className="text-xs text-amber-600">
                  GOOGLE_TTS_CREDENTIALS_B64 is not set in this environment, so generation will fail.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Loading coverage...</p>
          )}

          {audioError ? <p className="text-sm text-red-600">{audioError}</p> : null}
          {audioMessage ? <p className="text-sm text-emerald-600">{audioMessage}</p> : null}

          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={generatingAudio || !audioStatus || audioStatus.missing === 0}
            onClick={() => void handleGenerateAudio()}
          >
            {generatingAudio ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Volume2 className="mr-2 h-4 w-4" />
            )}
            Generate missing audio
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
