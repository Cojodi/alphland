"use client";

import { useState } from "react";

export function ActivityFeed() {
  const [activeTab, setActiveTab] = useState<"activity" | "projects">(
    "activity"
  );

  return (
    <div className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-border-grey dark:border-dark-charcoal">
        {[
          { id: "activity" as const, label: "Activity Feed" },
          { id: "projects" as const, label: "Personal Projects" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === tab.id
                ? "text-orange border-b-2 border-orange"
                : "text-light-charcoal dark:text-lightgrey border-b-2 border-transparent hover:text-black dark:hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-8">
        <p className="text-light-charcoal dark:text-lightgrey text-center py-8">
          No activity yet. Start participating in bounties to see your activity
          here.
        </p>
      </div>
    </div>
  );
}
