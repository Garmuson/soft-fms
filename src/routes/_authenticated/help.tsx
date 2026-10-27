import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Eye,
  Info,
  Lightbulb,
  Printer,
  Search,
} from "lucide-react";
import { MANUAL, MANUAL_META, visibleChapters, type ManualChapter } from "@/content/manual";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/help")({
  head: () => ({
    meta: [
      { title: "Help Centre · YM-FMS" },
      {
        name: "description",
        content:
          "The complete YM-FMS user manual: guides, field references, workflows, troubleshooting and support contacts.",
      },
      { property: "og:title", content: "Help Centre · YM-FMS" },
      { property: "og:description", content: "User manual for the SPPCC yellow machine fleet system." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HelpCentre,
});

/** Render inline **bold** markers as <strong>. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-foreground">
            {p}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

/** Render a screens[] block: paragraphs, pipe tables, and [SCREENSHOT: …] placeholders. */
function ScreenBlocks({ screens }: { screens: string[] }) {
  const nodes: React.ReactNode[] = [];
  let table: string[][] = [];
  const flush = () => {
    if (!table.length) return;
    const [head, ...rows] = table;
    if (!head) {
      table = [];
      return;
    }
    nodes.push(
      <div key={`t${nodes.length}`} className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              {head.map((h, i) => (
                <th key={i} className="border-b border-border px-2 py-1.5 text-left font-semibold text-gold">
                  <Inline text={h} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri} className={ri % 2 ? "bg-surface-2/40" : ""}>
                {r.map((c, ci) => (
                  <td key={ci} className="border-b border-border/60 px-2 py-1.5 align-top text-muted-foreground">
                    <Inline text={c} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
    );
    table = [];
  };
  for (const s of screens) {
    if (s.startsWith("|")) {
      const cells = s.split("|").slice(1, -1).map((c) => c.trim());
      if (cells.every((c) => /^-+$/.test(c) || c === "")) continue; // separator row
      table.push(cells);
      continue;
    }
    flush();
    if (s.startsWith("[SCREENSHOT:")) {
      nodes.push(
        <div key={nodes.length} className="rounded-md border border-dashed border-border bg-surface-2/40 px-3 py-6 text-center text-[11px] italic text-muted-foreground">
          {s}
        </div>,
      );
    } else {
      nodes.push(
        <p key={nodes.length} className="text-xs leading-relaxed text-muted-foreground">
          <Inline text={s} />
        </p>,
      );
    }
  }
  flush();
  return <div className="space-y-2.5">{nodes}</div>;
}

const CALLOUT_STYLE = {
  tip: { cls: "border-teal/40 bg-green-dim/40 text-teal", icon: Lightbulb, label: "Tip" },
  warning: { cls: "border-amber/40 bg-amber-dim/40 text-amber", icon: AlertTriangle, label: "Warning" },
  note: { cls: "border-blue/40 bg-blue-dim/40 text-blue", icon: Info, label: "Note" },
} as const;

function Chapter({ chapter }: { chapter: ManualChapter }) {
  return (
    <section id={chapter.id} className="manual-chapter scroll-mt-20">
      <h2 className="border-b-2 border-b-gold pb-1.5 text-base font-semibold text-gold">
        {chapter.title}
      </h2>

      <h3 className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Overview</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        <Inline text={chapter.overview} />
      </p>

      {chapter.screens.length > 0 && (
        <>
          <h3 className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">What you see</h3>
          <div className="mt-1.5">
            <ScreenBlocks screens={chapter.screens} />
          </div>
        </>
      )}

      {chapter.procedures.map((p) => (
        <div key={p.title} className="mt-4">
          <h3 className="text-[13px] font-semibold text-foreground">{p.title}</h3>
          <ol className="mt-1.5 space-y-1.5">
            {p.steps.map((s, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                <span className="num shrink-0 font-semibold text-gold">{i + 1}.</span>
                <span>
                  <Inline text={s} />
                </span>
              </li>
            ))}
          </ol>
        </div>
      ))}

      {chapter.fields && chapter.fields.length > 0 && (
        <div className="mt-4">
          <h3 className="text-[13px] font-semibold text-foreground">Field reference</h3>
          <div className="mt-1.5 overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  {["Field", "Description", "Required", "Rules / Format"].map((h) => (
                    <th key={h} className="border-b border-border px-2 py-1.5 text-left font-semibold text-gold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chapter.fields.map((f, i) => (
                  <tr key={f.field} className={i % 2 ? "bg-surface-2/40" : ""}>
                    <td className="border-b border-border/60 px-2 py-1.5 font-medium text-foreground">{f.field}</td>
                    <td className="border-b border-border/60 px-2 py-1.5 text-muted-foreground">{f.description}</td>
                    <td className="border-b border-border/60 px-2 py-1.5 text-muted-foreground">{f.required}</td>
                    <td className="border-b border-border/60 px-2 py-1.5 text-muted-foreground">{f.rules}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {chapter.roleNotes && chapter.roleNotes.length > 0 && (
        <div className="mt-4 rounded-md border border-gold/40 bg-gold-dim/30 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gold">Role notes</p>
          <ul className="mt-1.5 space-y-1">
            {chapter.roleNotes.map((n) => (
              <li key={n} className="text-xs text-muted-foreground">
                <Inline text={n} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {chapter.callouts?.map((c, i) => {
        const s = CALLOUT_STYLE[c.kind];
        return (
          <div key={i} className={cn("mt-3 flex gap-2 rounded-md border p-3", s.cls)}>
            <s.icon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <p className="text-xs leading-relaxed">
              <span className="font-semibold">{s.label}: </span>
              <Inline text={c.text} />
            </p>
          </div>
        );
      })}
    </section>
  );
}

function HelpCentre() {
  const { role, loading } = useAuth();
  const [query, setQuery] = useState("");
  const [viewAll, setViewAll] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const scrolled = useRef(false);

  const isAdmin = role === "hq_admin";
  const chapters = useMemo(() => visibleChapters(role, isAdmin && viewAll), [role, isAdmin, viewAll]);

  const q = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!q) return chapters;
    return chapters.filter((c) => {
      const hay = [
        c.title,
        c.overview,
        ...c.screens,
        ...c.procedures.flatMap((p) => [p.title, ...p.steps]),
        ...(c.fields ?? []).flatMap((f) => [f.field, f.description, f.rules]),
        ...(c.roleNotes ?? []),
        ...(c.callouts ?? []).map((x) => x.text),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [chapters, q]);

  // Deep link: /help#chapter-id — scroll to the chapter on load.
  useEffect(() => {
    if (loading || scrolled.current) return;
    scrolled.current = true;
    const id = window.location.hash.replace("#", "");
    if (!id) return;
    const t = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ block: "start" });
    }, 150);
    return () => clearTimeout(t);
  }, [loading]);

  if (loading) return <p className="p-6 text-xs text-muted-foreground">Loading manual…</p>;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 no-print">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground after:mt-1.5 after:block after:h-[3px] after:w-10 after:bg-gold">
            Help Centre
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            The complete user manual — filtered to {role ? "your role" : "you"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setViewAll((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                viewAll ? "border-gold bg-gold-dim text-gold" : "border-border bg-surface-2 text-foreground",
              )}
            >
              <Eye className="size-3.5" aria-hidden />
              {viewAll ? "Viewing all chapters" : "View all chapters"}
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary-dark"
          >
            <Printer className="size-3.5" aria-hidden />
            Print / Save as PDF
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Table of contents */}
        <nav className="no-print sticky top-16 hidden h-[calc(100vh-6rem)] w-60 shrink-0 overflow-y-auto rounded-lg border border-border bg-surface p-3 md:block" aria-label="Manual contents">
          <div className="relative mb-3">
            <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the manual…"
              aria-label="Search the manual"
              className="w-full rounded-md border border-border bg-background py-1.5 pl-7 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:border-blue"
            />
          </div>
          {q && (
            <p className="mb-2 text-[11px] text-muted-foreground">
              {matches.length} of {chapters.length} chapters match
            </p>
          )}
          <ul className="space-y-0.5">
            {matches.map((c) => (
              <li key={c.id}>
                <div className="flex items-center">
                  <a
                    href={`#${c.id}`}
                    className="flex flex-1 items-center gap-1.5 rounded-md px-1.5 py-1.5 text-xs text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                  >
                    <BookOpen className="size-3 shrink-0 text-gold" aria-hidden />
                    {c.title}
                  </a>
                  {(c.procedures.length > 0 || (c.fields?.length ?? 0) > 0) && (
                    <button
                      onClick={() => setOpen((o) => ({ ...o, [c.id]: !o[c.id] }))}
                      aria-label={`${open[c.id] ? "Collapse" : "Expand"} ${c.title}`}
                      className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                    >
                      {open[c.id] ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                    </button>
                  )}
                </div>
                {open[c.id] && (
                  <ul className="ml-5 space-y-0.5 border-l border-border pl-2">
                    {c.procedures.map((p) => (
                      <li key={p.title}>
                        <a href={`#${c.id}`} className="block py-0.5 text-[11px] text-muted-foreground hover:text-foreground">
                          {p.title}
                        </a>
                      </li>
                    ))}
                    {(c.fields?.length ?? 0) > 0 && (
                      <li>
                        <a href={`#${c.id}`} className="block py-0.5 text-[11px] text-muted-foreground hover:text-foreground">
                          Field reference
                        </a>
                      </li>
                    )}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Manual body */}
        <div id="manual-print-root" className="min-w-0 flex-1">
          {/* Print-only cover page */}
          <div className="manual-cover hidden print:block">
            <p className="text-sm font-semibold text-gold">SPPCC — Liberia</p>
            <h1 className="mt-24 text-3xl font-bold text-foreground">{MANUAL_META.name}</h1>
            <h2 className="mt-2 text-xl text-muted-foreground">User Manual</h2>
            <div className="mt-32 text-sm leading-relaxed text-muted-foreground">
              <p>Version {MANUAL_META.version}</p>
              <p>{MANUAL_META.date}</p>
              <p className="mt-4">Prepared by {MANUAL_META.preparedBy}</p>
            </div>
          </div>

          {/* On phones, the TOC collapses into a simple chapter jump list */}
          <nav className="no-print mb-3 rounded-lg border border-border bg-surface p-2 md:hidden" aria-label="Manual contents">
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the manual…"
                aria-label="Search the manual"
                className="w-full rounded-md border border-border bg-background py-2 pl-7 pr-2 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {matches.map((c) => (
                <a
                  key={c.id}
                  href={`#${c.id}`}
                  className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] text-muted-foreground"
                >
                  {c.title}
                </a>
              ))}
            </div>
          </nav>

          <div className="space-y-8 rounded-lg border border-border bg-surface p-4 sm:p-6">
            {matches.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No chapters match “{query}”. Try a shorter word, e.g. “fuel”, “driver” or “alert”.
              </p>
            ) : (
              matches.map((c) => <Chapter key={c.id} chapter={c} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
