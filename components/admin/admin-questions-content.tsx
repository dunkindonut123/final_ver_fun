"use client";

import { useMemo, useState } from "react";
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
import { parseCsv } from "@/lib/lms/csv-parser";
import { Download, Loader2, Upload } from "lucide-react";

interface CsvValidationError {
  row: number;
  field?: string;
  message: string;
  locator?: string;
  searchText?: string;
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

  const previewRows = useMemo(() => preview.slice(0, 10), [preview]);

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
              does not change A.               Assignment A requires pinyin_hint and meaning_hint; B only requires the hanzi answer.
              Per-level slots: {assignmentACountLegend()}. Supported keys: {ASSIGNMENT_KEYS.join(", ")}.
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
    </>
  );
}
