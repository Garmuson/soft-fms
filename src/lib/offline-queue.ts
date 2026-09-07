import { supabase } from "@/integrations/supabase/client";

/**
 * Field tablets often lose signal on the road corridors. Submissions made
 * offline are held in the browser and pushed to the central system as soon as
 * the connection returns.
 */
export type QueuedTable = "fuel_logs" | "inspections" | "alerts";

export type QueuedItem = {
  id: string;
  table: QueuedTable;
  label: string;
  payload: Record<string, unknown>;
  queued_at: string;
};

const KEY = "ymfms.pending";
const EVENT = "ymfms-pending-changed";

function read(): QueuedItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as QueuedItem[];
  } catch {
    return [];
  }
}

function write(items: QueuedItem[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

export function pendingItems() {
  return read();
}

export function subscribePending(fn: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, fn);
  window.addEventListener("online", fn);
  return () => {
    window.removeEventListener(EVENT, fn);
    window.removeEventListener("online", fn);
  };
}

export function enqueue(table: QueuedTable, label: string, payload: Record<string, unknown>) {
  const items = read();
  items.push({
    id: crypto.randomUUID(),
    table,
    label,
    payload,
    queued_at: new Date().toISOString(),
  });
  write(items);
}

export function removeQueued(id: string) {
  write(read().filter((i) => i.id !== id));
}

/**
 * Submits a record, or queues it locally when the device is offline or the
 * write fails for a network reason. Returns how the record was handled.
 */
export async function submitOrQueue(
  table: QueuedTable,
  label: string,
  payload: Record<string, unknown>,
): Promise<{ queued: boolean; error?: string }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    enqueue(table, label, payload);
    return { queued: true };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from(table).insert(payload as any);
  if (!error) return { queued: false };
  const networkish = /network|fetch|failed|timeout/i.test(error.message);
  if (networkish) {
    enqueue(table, label, payload);
    return { queued: true };
  }
  return { queued: false, error: error.message };
}

/** Pushes every held submission to the central system, keeping any that fail. */
export async function flushQueue(): Promise<{ sent: number; failed: number }> {
  const items = read();
  let sent = 0;
  const keep: QueuedItem[] = [];
  for (const item of items) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from(item.table).insert(item.payload as any);
    if (error) keep.push(item);
    else sent++;
  }
  write(keep);
  return { sent, failed: keep.length };
}
