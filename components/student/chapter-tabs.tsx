"use client";

import { useState } from "react";

type TabType = "materials" | "exercise";

interface ChapterTabsProps {
  chapterId: string;
  materialsContent?: React.ReactNode;
  exerciseContent?: React.ReactNode;
}

export function ChapterTabs({
  chapterId,
  materialsContent,
  exerciseContent,
}: ChapterTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("materials");

  const tabs: { id: TabType; label: string; content: React.ReactNode }[] = [
    {
      id: "materials",
      label: "Materials",
      content:
        materialsContent || (
          <div className="py-8 text-center">
            <h2 className="mb-2 text-lg font-semibold text-card-foreground">
              Learning Materials
            </h2>
            <p className="text-muted-foreground">
              Content for chapter {chapterId} - Materials section
            </p>
          </div>
        ),
    },
    {
      id: "exercise",
      label: "Exercise",
      content:
        exerciseContent || (
          <div className="py-8 text-center">
            <h2 className="mb-2 text-lg font-semibold text-card-foreground">
              Exercise
            </h2>
            <p className="text-muted-foreground">
              Content for chapter {chapterId} - Exercise section
            </p>
          </div>
        ),
    },
  ];

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="border-b border-border">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {/* Active tab underline */}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-6">
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}
