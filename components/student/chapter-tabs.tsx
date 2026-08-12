"use client";

import { useState } from "react";
import { BookOpen, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

type TabType = "assignments" | "materials";

interface ChapterTabsProps {
  assignmentsContent: React.ReactNode;
  materialsContent?: React.ReactNode;
}

const tabs: {
  id: TabType;
  label: string;
  description: string;
  icon: typeof ClipboardList;
}[] = [
  {
    id: "assignments",
    label: "Assignments",
    description: "Practice and complete your tasks",
    icon: ClipboardList,
  },
  {
    id: "materials",
    label: "Materials",
    description: "Study guides and references",
    icon: BookOpen,
  },
];

export function ChapterTabs({ assignmentsContent, materialsContent }: ChapterTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("assignments");

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-white/20 bg-background/75 shadow-lg shadow-foreground/5">
        <div className="grid grid-cols-2 gap-2 border-b border-border/60 p-2.5 sm:gap-4 sm:p-5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "group relative flex min-h-12 flex-col items-start justify-center gap-1 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 sm:min-h-[6rem] sm:rounded-2xl sm:px-6 sm:py-5",
                  isActive
                    ? "border-[#1e5fa8]/30 bg-[#1e5fa8] text-white shadow-md shadow-[#1e5fa8]/20"
                    : "border-border/60 bg-muted/30 text-foreground hover:border-[#1e5fa8]/20 hover:bg-muted/60"
                )}
              >
                <div className="flex w-full items-center gap-2 sm:gap-3">
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors sm:h-11 sm:w-11 sm:rounded-xl",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-background text-[#1e5fa8] group-hover:bg-[#1e5fa8]/10"
                    )}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-semibold sm:text-lg",
                        isActive ? "text-white" : "text-foreground"
                      )}
                    >
                      {tab.label}
                    </p>
                    <p
                      className={cn(
                        "mt-0.5 hidden text-sm leading-snug sm:block",
                        isActive ? "text-white/80" : "text-muted-foreground"
                      )}
                    >
                      {tab.description}
                    </p>
                  </div>
                </div>

                {isActive ? (
                  <span className="absolute bottom-3 right-4 hidden h-2 w-2 rounded-full bg-white/90 sm:block" />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="p-3 sm:p-6 md:p-8">
          {activeTab === "assignments"
            ? assignmentsContent
            : (materialsContent ?? (
                <p className="text-center text-muted-foreground">Materials coming soon.</p>
              ))}
        </div>
      </div>
    </div>
  );
}
