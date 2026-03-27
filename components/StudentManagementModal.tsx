"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  unlockChapterForStudent,
  lockChapterForStudent,
  unlockHSKLevelForStudent,
  lockHSKLevelForStudent,
} from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { X, ChevronDown, ChevronUp } from "lucide-react";

interface Chapter {
  id: string;
  title: string;
  hsk_level: number;
  chapter_number: number;
}

interface StudentManagementModalProps {
  studentId: string;
  studentName: string;
  onClose: () => void;
}

interface UnlockedMap {
  [key: string]: boolean;
}

interface ProgressMap {
  [key: string]: {
    score?: number;
    completed: boolean;
    time_spent_minutes: number;
    last_accessed: string | null;
  };
}

function generateFallbackChapters(): Chapter[] {
  const output: Chapter[] = [];
  for (let level = 1; level <= 6; level += 1) {
    for (let chapter = 1; chapter <= 10; chapter += 1) {
      output.push({
        id: `hsk${level}-ch${chapter}`,
        title: `Chapter ${chapter}`,
        hsk_level: level,
        chapter_number: chapter,
      });
    }
  }
  return output;
}

export default function StudentManagementModal({
  studentId,
  studentName,
  onClose,
}: StudentManagementModalProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [unlocked, setUnlocked] = useState<UnlockedMap>({});
  const [progress, setProgress] = useState<ProgressMap>({});
  const [loading, setLoading] = useState(true);
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);

  const fallbackChapters = useMemo(() => generateFallbackChapters(), []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient();

        const { data: chaptersData, error: chaptersError } = await supabase
          .from("hsk_chapters")
          .select("id, title, hsk_level, chapter_number")
          .order("hsk_level", { ascending: true })
          .order("chapter_number", { ascending: true });

        if (chaptersError || !chaptersData || chaptersData.length === 0) {
          setChapters(fallbackChapters);
        } else {
          setChapters(chaptersData);
        }

        const { data: accessData } = await supabase
          .from("student_chapter_access")
          .select("chapter_id, is_unlocked")
          .eq("student_id", studentId);

        const unlockedMap: UnlockedMap = {};
        accessData?.forEach((item) => {
          unlockedMap[item.chapter_id] = item.is_unlocked;
        });
        setUnlocked(unlockedMap);

        const { data: progressData } = await supabase
          .from("student_chapter_progress")
          .select("chapter_id, score, is_completed, time_spent_minutes, last_accessed")
          .eq("student_id", studentId);

        const progressMap: ProgressMap = {};
        progressData?.forEach((item) => {
          progressMap[item.chapter_id] = {
            score: item.score,
            completed: item.is_completed,
            time_spent_minutes: item.time_spent_minutes ?? 0,
            last_accessed: item.last_accessed,
          };
        });
        setProgress(progressMap);

        setLoading(false);
      } catch (err) {
        console.error("Failed to load student data:", err);
        setLoading(false);
      }
    };

    loadData();
  }, [fallbackChapters, studentId]);

  const handleToggleChapter = async (chapterId: string) => {
    setUpdating(true);
    try {
      const isCurrentlyUnlocked = unlocked[chapterId];

      if (isCurrentlyUnlocked) {
        await lockChapterForStudent(studentId, chapterId);
      } else {
        await unlockChapterForStudent(studentId, chapterId);
      }

      setUnlocked({
        ...unlocked,
        [chapterId]: !isCurrentlyUnlocked,
      });
    } catch (err) {
      console.error("Failed to toggle chapter:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleLevel = async (level: number) => {
    setUpdating(true);
    try {
      const levelChapters = chapters.filter((ch) => ch.hsk_level === level);
      const allUnlocked = levelChapters.every((ch) => unlocked[ch.id]);

      if (allUnlocked) {
        await lockHSKLevelForStudent(studentId, level);
        const newUnlocked = { ...unlocked };
        levelChapters.forEach((ch) => {
          newUnlocked[ch.id] = false;
        });
        setUnlocked(newUnlocked);
      } else {
        await unlockHSKLevelForStudent(studentId, level);
        const newUnlocked = { ...unlocked };
        levelChapters.forEach((ch) => {
          newUnlocked[ch.id] = true;
        });
        setUnlocked(newUnlocked);
      }
    } catch (err) {
      console.error("Failed to toggle level:", err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="max-h-96 w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
          <div className="text-center">
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b bg-white p-6">
          <h2 className="text-2xl font-bold text-slate-900">{studentName}</h2>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-900">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {Array.from({ length: 6 }, (_, i) => i + 1).map((level) => {
            const levelChapters = chapters.filter((ch) => ch.hsk_level === level);
            const allUnlocked = levelChapters.length > 0 && levelChapters.every((ch) => unlocked[ch.id]);
            const isExpanded = expandedLevel === level;

            return (
              <div key={level} className="overflow-hidden rounded-lg border">
                <div className="flex w-full items-center justify-between bg-slate-50 p-4">
                  <button
                    type="button"
                    onClick={() => setExpandedLevel(isExpanded ? null : level)}
                    className="flex flex-1 items-center justify-between rounded px-1 py-1 text-left transition-colors hover:bg-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-900">HSK Level {level}</span>
                      <span className="text-sm text-slate-600">
                        {levelChapters.filter((ch) => unlocked[ch.id]).length}/{levelChapters.length} unlocked
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  <div className="ml-2">
                    <Button
                      onClick={() => handleToggleLevel(level)}
                      disabled={updating || levelChapters.length === 0}
                      size="sm"
                      variant={allUnlocked ? "destructive" : "default"}
                    >
                      {allUnlocked ? "Lock Level" : "Unlock Level"}
                    </Button>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="space-y-2 border-t bg-white p-4">
                    {levelChapters.map((chapter) => {
                      const chapterProgress = progress[chapter.id];

                      return (
                        <div
                          key={chapter.id}
                          className="flex items-center justify-between rounded bg-slate-50 p-3 transition-colors hover:bg-slate-100"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{chapter.title}</p>
                            {chapterProgress ? (
                              <div className="mt-1 space-y-1 text-xs text-slate-600">
                                <p>
                                  {chapterProgress.completed
                                    ? `Completed - Score: ${chapterProgress.score}%`
                                    : "Not completed"}
                                </p>
                                <p>Time: {chapterProgress.time_spent_minutes} mins</p>
                                {chapterProgress.last_accessed ? (
                                  <p>
                                    Last accessed: {new Date(chapterProgress.last_accessed).toLocaleDateString("en-US")}
                                  </p>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                          <Button
                            onClick={() => handleToggleChapter(chapter.id)}
                            disabled={updating}
                            size="sm"
                            variant={unlocked[chapter.id] ? "destructive" : "default"}
                          >
                            {unlocked[chapter.id] ? "Lock" : "Unlock"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
