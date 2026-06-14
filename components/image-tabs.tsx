"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";

const TABS = [
  { id: "organize", label: "Organize Applications", src: "/hero-images/hero1.png" },
  { id: "hired", label: "Get Hired", src: "/hero-images/hero2.png" },
  { id: "boards", label: "Manage Boards", src: "/hero-images/hero3.png" },
] as const;

export default function ImageTabs() {
  const [activeTab, setActiveTab] =
    useState<(typeof TABS)[number]["id"]>("organize");

  const active = TABS.find((t) => t.id === activeTab) ?? TABS[0];

  return (
    <section className="bg-background py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          {/* Segmented control */}
          <div className="mb-10 flex justify-center">
            <div className="inline-flex flex-wrap justify-center gap-1 rounded-xl border border-border bg-muted/60 p-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <Image
              key={active.id}
              src={active.src}
              alt={active.label}
              width={1200}
              height={800}
              className="w-full"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
