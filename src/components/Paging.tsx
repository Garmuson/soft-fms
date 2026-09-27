import { btn, inputCls } from "@/components/kit";

export const PAGE_SIZES = [25, 50, 100] as const;

export function pageRange(page: number, size: number) {
  const from = page * size;
  return [from, from + size - 1] as const;
}

export function Paging({
  page,
  size,
  total,
  onPage,
  onSize,
}: {
  page: number;
  size: number;
  total: number;
  onPage: (p: number) => void;
  onSize: (s: number) => void;
}) {
  const from = total === 0 ? 0 : page * size + 1;
  const to = Math.min(total, (page + 1) * size);
  const last = Math.max(0, Math.ceil(total / size) - 1);
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      <span className="num">
        Showing {from}–{to} of {total}
      </span>
      <label className="flex items-center gap-1.5">
        Rows
        <select
          className={`${inputCls} w-20`}
          value={size}
          onChange={(e) => {
            onSize(Number(e.target.value));
            onPage(0);
          }}
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <div className="ml-auto flex gap-2">
        <button className={btn.secondary} disabled={page <= 0} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        <button className={btn.secondary} disabled={page >= last} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
