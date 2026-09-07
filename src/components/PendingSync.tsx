import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CloudOff, RefreshCw } from "lucide-react";
import { Panel, btn } from "@/components/kit";
import { flushQueue, pendingItems, removeQueued, subscribePending, type QueuedItem } from "@/lib/offline-queue";
import { fmtDateTime } from "@/lib/fleet";

/**
 * Shows submissions held on this device because the tablet was offline, and
 * pushes them to the central system as soon as a connection is available.
 */
export function PendingSync() {
  const [items, setItems] = useState<QueuedItem[]>([]);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    setItems(pendingItems());
    return subscribePending(() => setItems(pendingItems()));
  }, []);

  async function sync(silent = false) {
    if (busy) return;
    setBusy(true);
    const { sent, failed } = await flushQueue();
    setBusy(false);
    setItems(pendingItems());
    if (sent > 0) {
      toast.success(`${sent} held ${sent === 1 ? "entry" : "entries"} sent to HQ`);
      qc.invalidateQueries();
    } else if (!silent && failed > 0) {
      toast.error("Still no connection — entries are safe on this device");
    }
  }

  // Auto-send as soon as the connection returns.
  useEffect(() => {
    const onOnline = () => void sync(true);
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items.length === 0) return null;

  return (
    <Panel
      title={`Waiting to send (${items.length})`}
      className="mb-4 border-amber/40"
      action={
        <button className={btn.secondary} onClick={() => void sync()} disabled={busy}>
          <RefreshCw className={busy ? "size-3.5 animate-spin" : "size-3.5"} aria-hidden />
          {busy ? "Sending…" : "Send now"}
        </button>
      }
    >
      <p className="mb-2 flex items-center gap-1.5 text-[11px] text-amber">
        <CloudOff className="size-3.5" aria-hidden />
        These entries are saved on this tablet and will be sent automatically when you have signal.
      </p>
      <ul className="space-y-1.5 text-xs">
        {items.map((i) => (
          <li key={i.id} className="flex items-center justify-between gap-2 border-b border-border pb-1.5">
            <span className="min-w-0">
              <span className="block truncate">{i.label}</span>
              <span className="num text-[10px] text-muted-foreground">{fmtDateTime(i.queued_at)}</span>
            </span>
            <button
              className="text-[11px] text-muted-foreground hover:text-red"
              onClick={() => {
                removeQueued(i.id);
                setItems(pendingItems());
              }}
            >
              Discard
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
