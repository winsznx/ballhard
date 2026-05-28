"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Drawer } from "vaul";
import { Menu, X } from "lucide-react";

export type DocsSection = {
  id: string;
  label: string;
  subheadings?: { id: string; label: string }[];
};

export function DocsLayout({
  sections,
  children,
}: {
  sections: DocsSection[];
  children: React.ReactNode;
}) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");
  const [navOpen, setNavOpen] = useState(false);
  const allIds = useRef<string[]>([]);

  if (allIds.current.length === 0) {
    allIds.current = sections.flatMap((s) => [s.id, ...(s.subheadings?.map((h) => h.id) ?? [])]);
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top,
          );
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      // Activates a heading when it's in the upper 30% of the viewport.
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );
    for (const id of allIds.current) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const onNavClick = useCallback(
    (id: string) => {
      setNavOpen(false);
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", `#${id}`);
      }
    },
    [],
  );

  const activeSectionId =
    sections.find(
      (s) => s.id === activeId || s.subheadings?.some((h) => h.id === activeId),
    )?.id ?? activeId;

  return (
    <div className="min-h-dvh bg-void-0 text-ink-1">
      {/* Top bar (mobile + desktop) */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[var(--glass-border)] bg-[rgba(8,8,12,0.85)] px-4 backdrop-blur-xl">
        <Link
          href="/"
          className="flex items-center gap-2 text-caption-mono font-mono tracking-[0.22em] text-ink-1"
        >
          <span aria-hidden>←</span> BALLHARD
        </Link>
        <span className="font-mono text-caption-1 tracking-[0.18em] text-ink-3 hidden sm:inline">
          DOCS
        </span>
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          className="rounded-full border border-[var(--glass-border)] p-1.5 md:hidden"
          aria-label="Open section navigation"
        >
          <Menu className="size-4 text-ink-1" />
        </button>
      </header>

      <div className="mx-auto flex w-full max-w-[1240px] gap-8 px-4 md:px-6">
        {/* Left rail (desktop) */}
        <aside className="hidden md:block w-56 shrink-0 py-10">
          <nav className="sticky top-20 flex flex-col gap-1">
            <SectionList
              sections={sections}
              activeSectionId={activeSectionId}
              onClick={onNavClick}
            />
          </nav>
        </aside>

        {/* Center content */}
        <main className="min-w-0 flex-1 py-10 md:py-12">
          <div className="max-w-[680px] mx-auto">{children}</div>
        </main>

        {/* Right rail — "On this page" */}
        <aside className="hidden lg:block w-52 shrink-0 py-10">
          <nav className="sticky top-20 flex flex-col gap-2">
            <span className="mb-2 font-mono text-caption-1 tracking-[0.18em] text-ink-3">
              ON THIS PAGE
            </span>
            <OnThisPage
              sections={sections}
              activeId={activeId}
              activeSectionId={activeSectionId}
              onClick={onNavClick}
            />
          </nav>
        </aside>
      </div>

      {/* Mobile section nav (Vaul drawer) */}
      <Drawer.Root
        open={navOpen}
        onOpenChange={setNavOpen}
        direction="left"
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[60] bg-[rgba(0,0,0,0.6)]" />
          <Drawer.Content className="fixed inset-y-0 left-0 z-[70] flex w-72 flex-col border-r border-[var(--glass-border)] bg-[rgba(14,14,20,0.96)] backdrop-blur-2xl outline-none">
            <Drawer.Title className="sr-only">Documentation sections</Drawer.Title>
            <Drawer.Description className="sr-only">
              Navigate between BALLHARD documentation sections.
            </Drawer.Description>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-border)]">
              <span className="font-mono text-caption-1 tracking-[0.22em] text-ink-3">
                SECTIONS
              </span>
              <button
                type="button"
                onClick={() => setNavOpen(false)}
                className="rounded-full border border-[var(--glass-border)] p-1"
                aria-label="Close section navigation"
              >
                <X className="size-4 text-ink-1" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
              <SectionList
                sections={sections}
                activeSectionId={activeSectionId}
                onClick={onNavClick}
              />
            </nav>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}

function SectionList({
  sections,
  activeSectionId,
  onClick,
}: {
  sections: DocsSection[];
  activeSectionId: string;
  onClick: (id: string) => void;
}) {
  return (
    <>
      {sections.map((s) => {
        const active = s.id === activeSectionId;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onClick(s.id)}
            className={`text-left rounded-md px-3 py-1.5 text-subhead transition-colors ${
              active
                ? "bg-[var(--glass-fill-2)] text-ink-1"
                : "text-ink-2 hover:bg-[var(--glass-fill)] hover:text-ink-1"
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </>
  );
}

function OnThisPage({
  sections,
  activeId,
  activeSectionId,
  onClick,
}: {
  sections: DocsSection[];
  activeId: string;
  activeSectionId: string;
  onClick: (id: string) => void;
}) {
  const active = sections.find((s) => s.id === activeSectionId);
  if (!active?.subheadings || active.subheadings.length === 0) {
    return (
      <span className="text-caption-1 text-ink-3 leading-relaxed">
        Scroll a section to see its sub-headings here.
      </span>
    );
  }
  return (
    <>
      {active.subheadings.map((h) => {
        const isActive = h.id === activeId;
        return (
          <button
            key={h.id}
            type="button"
            onClick={() => onClick(h.id)}
            className={`text-left text-caption-1 leading-relaxed transition-colors ${
              isActive ? "text-ink-1" : "text-ink-3 hover:text-ink-2"
            }`}
          >
            {h.label}
          </button>
        );
      })}
    </>
  );
}
