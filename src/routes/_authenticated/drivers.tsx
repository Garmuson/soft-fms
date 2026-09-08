import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Plus, X } from "lucide-react";
import { driversQuery, hubsQuery, type Driver } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, btn, inputCls } from "@/components/kit";
import { RoleGate } from "@/components/RoleGate";
import { useAuth } from "@/hooks/use-auth";
import { logAudit } from "@/lib/audit";
import {
  EMPLOYMENT_TYPES,
  ENTRY_STATUS_LABEL,
  entryStatusClasses,
  MACHINE_TYPE_LABEL,
} from "@/lib/fleet";

export const Route = createFileRoute("/_authenticated/drivers")({
  head: () => ({
    meta: [
      { title: "Driver Registry · YM-FMS" },
      {
        name: "description",
        content:
          "Registry of Yellow Machine drivers and operators with licence, certification and employment records across all 19 hubs.",
      },
      { property: "og:title", content: "Driver Registry · YM-FMS" },
      {
        property: "og:description",
        content: "Licence validity, machine certifications and employment details for every driver.",
      },
    ],
  }),
  component: () => (
    <RoleGate
      allow={[
        "hq_admin",
        "hub_supervisor",
        "ministry_analyst",
        "data_entry_supervisor",
        "data_entry_staff",
      ]}
    >
      <DriversPage />
    </RoleGate>
  ),
});

const CERT_TYPES = Object.keys(MACHINE_TYPE_LABEL);

const EMPTY = {
  staff_no: "",
  full_name: "",
  phone: "",
  licence_number: "",
  licence_class: "",
  licence_issued: "",
  licence_expiry: "",
  certified_types: [] as string[],
  training_date: "",
  medical_check_date: "",
  employment_type: "permanent",
  date_joined: "",
  next_of_kin_name: "",
  next_of_kin_phone: "",
  notes: "",
  is_active: true,
};

function daysUntil(date: string | null) {
  if (!date) return null;
  return Math.round((new Date(date).getTime() - Date.now()) / 86_400_000);
}

function DriversPage() {
  const { role, profile, hubId } = useAuth();
  const qc = useQueryClient();
  const national = role === "hq_admin" || role === "data_entry_supervisor" || role === "ministry_analyst";
  const canEdit = role !== "ministry_analyst";
  const needsReview = role === "data_entry_staff";
  const [hubFilter, setHubFilter] = useState<number | "">("");
  const scope = national ? (hubFilter === "" ? null : hubFilter) : (hubId ?? null);

  const { data: hubs = [] } = useQuery(hubsQuery());
  const { data: drivers = [], isLoading } = useQuery(driversQuery(scope));
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Driver | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY, hub_id: hubId ?? 1 });
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return drivers;
    return drivers.filter(
      (d) =>
        d.full_name.toLowerCase().includes(t) ||
        d.staff_no.toLowerCase().includes(t) ||
        (d.licence_number ?? "").toLowerCase().includes(t),
    );
  }, [drivers, search]);

  function startNew() {
    setEditing(null);
    setForm({ ...EMPTY, hub_id: scope ?? hubId ?? 1 });
    setOpen(true);
  }

  function startEdit(d: Driver) {
    setEditing(d);
    setForm({
      staff_no: d.staff_no,
      full_name: d.full_name,
      phone: d.phone ?? "",
      licence_number: d.licence_number ?? "",
      licence_class: d.licence_class ?? "",
      licence_issued: d.licence_issued ?? "",
      licence_expiry: d.licence_expiry ?? "",
      certified_types: d.certified_types ?? [],
      training_date: d.training_date ?? "",
      medical_check_date: d.medical_check_date ?? "",
      employment_type: d.employment_type,
      date_joined: d.date_joined ?? "",
      next_of_kin_name: d.next_of_kin_name ?? "",
      next_of_kin_phone: d.next_of_kin_phone ?? "",
      notes: d.notes ?? "",
      is_active: d.is_active,
      hub_id: d.hub_id,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.staff_no.trim() || !form.full_name.trim()) {
      toast.error("Staff number and full name are required");
      return;
    }
    setBusy(true);
    const payload = {
      staff_no: form.staff_no.trim(),
      full_name: form.full_name.trim(),
      phone: form.phone || null,
      hub_id: Number(form.hub_id),
      is_active: form.is_active,
      licence_number: form.licence_number || null,
      licence_class: form.licence_class || null,
      licence_issued: form.licence_issued || null,
      licence_expiry: form.licence_expiry || null,
      certified_types: form.certified_types,
      training_date: form.training_date || null,
      medical_check_date: form.medical_check_date || null,
      employment_type: form.employment_type,
      date_joined: form.date_joined || null,
      next_of_kin_name: form.next_of_kin_name || null,
      next_of_kin_phone: form.next_of_kin_phone || null,
      notes: form.notes || null,
    };
    const res = editing
      ? await supabase.from("drivers").update(payload).eq("id", editing.id)
      : await supabase.from("drivers").insert({
          ...payload,
          created_by: profile?.id ?? null,
          review_status: needsReview ? "pending" : "approved",
        });
    setBusy(false);
    if (res.error) {
      toast.error("Could not save the driver record", { description: res.error.message });
      return;
    }
    void logAudit(profile, {
      action: editing ? "updated driver" : "added driver",
      entity: "driver",
      entity_ref: form.staff_no,
      hub_id: Number(form.hub_id),
      detail: form.full_name,
    });
    toast.success(
      editing
        ? "Driver record updated"
        : needsReview
          ? "Driver sent for supervisor review"
          : "Driver added to the registry",
    );
    qc.invalidateQueries({ queryKey: ["drivers"] });
    qc.invalidateQueries({ queryKey: ["pending-entries"] });
    setOpen(false);
  }

  function exportCsv() {
    const head = [
      "Staff No",
      "Name",
      "Hub",
      "Phone",
      "Licence",
      "Class",
      "Licence expiry",
      "Certified for",
      "Employment",
      "Joined",
      "Active",
      "Status",
    ];
    const body = rows.map((d) => [
      d.staff_no,
      d.full_name,
      d.hub_id,
      d.phone ?? "",
      d.licence_number ?? "",
      d.licence_class ?? "",
      d.licence_expiry ?? "",
      (d.certified_types ?? []).join(" / "),
      d.employment_type,
      d.date_joined ?? "",
      d.is_active ? "Yes" : "No",
      d.review_status,
    ]);
    const csv = [head, ...body].map((r) => r.map((c) => `"${String(c)}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "ym-fms-drivers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        title="Driver Registry"
        subtitle={`${rows.length} driver${rows.length === 1 ? "" : "s"}${scope ? ` · Hub ${scope}` : " · all hubs"}`}
      />

      <Panel>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-[11px] text-muted-foreground">
            Search
            <input
              className={inputCls}
              placeholder="Name, staff number or licence"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          {national && (
            <label className="text-[11px] text-muted-foreground">
              Hub
              <select
                className={inputCls}
                value={hubFilter}
                onChange={(e) => setHubFilter(e.target.value === "" ? "" : Number(e.target.value))}
              >
                <option value="">All hubs</option>
                {hubs.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="ml-auto flex gap-2">
            <button className={btn.secondary} onClick={exportCsv}>
              <Download className="size-4" aria-hidden /> Export CSV
            </button>
            {canEdit && (
              <button className={btn.primary} onClick={startNew}>
                <Plus className="size-4" aria-hidden /> Add driver
              </button>
            )}
          </div>
        </div>
      </Panel>

      <Panel className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-2 py-2">Staff no</th>
              <th className="px-2 py-2">Driver</th>
              <th className="px-2 py-2">Hub</th>
              <th className="px-2 py-2">Licence</th>
              <th className="px-2 py-2">Expiry</th>
              <th className="px-2 py-2">Certified for</th>
              <th className="px-2 py-2">Employment</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={9} className="px-2 py-6 text-center text-muted-foreground">
                  Loading drivers…
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-2 py-6 text-center text-muted-foreground">
                  No drivers recorded yet. Use “Add driver” to start the registry.
                </td>
              </tr>
            )}
            {rows.map((d) => {
              const dl = daysUntil(d.licence_expiry);
              return (
                <tr key={d.id} className="border-b border-border/60 hover:bg-surface-2">
                  <td className="num px-2 py-2">{d.staff_no}</td>
                  <td className="px-2 py-2">
                    {d.full_name}
                    {!d.is_active && <span className="ml-1 text-[10px] text-muted-foreground">(inactive)</span>}
                    {d.phone && <div className="num text-[10px] text-muted-foreground">{d.phone}</div>}
                  </td>
                  <td className="num px-2 py-2">{d.hub_id}</td>
                  <td className="num px-2 py-2">
                    {d.licence_number ?? "—"}
                    {d.licence_class && (
                      <span className="ml-1 font-sans text-[10px] text-muted-foreground">
                        class {d.licence_class}
                      </span>
                    )}
                  </td>
                  <td className="num px-2 py-2">
                    {d.licence_expiry ?? "—"}
                    {dl !== null && dl < 60 && (
                      <span className={`ml-1 font-sans text-[10px] ${dl < 0 ? "text-red" : "text-amber"}`}>
                        {dl < 0 ? "expired" : `${dl}d`}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    {(d.certified_types ?? []).length
                      ? (d.certified_types ?? [])
                          .map((t) => MACHINE_TYPE_LABEL[t as keyof typeof MACHINE_TYPE_LABEL] ?? t)
                          .join(", ")
                      : "—"}
                  </td>
                  <td className="px-2 py-2 capitalize">{d.employment_type}</td>
                  <td className="px-2 py-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] ${entryStatusClasses(d.review_status)}`}>
                      {ENTRY_STATUS_LABEL[d.review_status] ?? d.review_status}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right">
                    {canEdit && (
                      <button className="text-[11px] text-blue hover:underline" onClick={() => startEdit(d)}>
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>

      {open && canEdit && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">{editing ? "Edit driver" : "Add driver"}</h2>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X className="size-4" aria-hidden />
              </button>
            </div>
            {needsReview && (
              <p className="mt-2 rounded-md border border-amber/40 bg-amber-dim/40 px-2 py-1.5 text-[11px] text-amber">
                Your entries are checked by the data entry supervisor before they go live.
              </p>
            )}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["staff_no", "Staff number", "text"],
                  ["full_name", "Full name", "text"],
                  ["phone", "Phone", "tel"],
                  ["licence_number", "Licence number", "text"],
                  ["licence_class", "Licence class", "text"],
                  ["licence_issued", "Licence issued", "date"],
                  ["licence_expiry", "Licence expiry", "date"],
                  ["training_date", "Last training", "date"],
                  ["medical_check_date", "Last medical check", "date"],
                  ["date_joined", "Date joined", "date"],
                  ["next_of_kin_name", "Next of kin", "text"],
                  ["next_of_kin_phone", "Next of kin phone", "tel"],
                ] as const
              ).map(([key, label, type]) => (
                <label key={key} className="block text-[11px] text-muted-foreground">
                  {label}
                  <input
                    type={type}
                    className={inputCls}
                    value={String(form[key] ?? "")}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </label>
              ))}
              <label className="block text-[11px] text-muted-foreground">
                Hub
                <select
                  className={inputCls}
                  value={form.hub_id}
                  disabled={!national}
                  onChange={(e) => setForm({ ...form, hub_id: Number(e.target.value) })}
                >
                  {hubs.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[11px] text-muted-foreground">
                Employment type
                <select
                  className={inputCls}
                  value={form.employment_type}
                  onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
                >
                  {EMPLOYMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <fieldset className="mt-4">
              <legend className="text-[11px] text-muted-foreground">Certified to operate</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {CERT_TYPES.map((t) => {
                  const on = form.certified_types.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          certified_types: on
                            ? form.certified_types.filter((x) => x !== t)
                            : [...form.certified_types, t],
                        })
                      }
                      className={`rounded-md border px-2 py-1 text-[11px] ${on ? "border-teal bg-green-dim text-teal" : "border-border text-muted-foreground"}`}
                    >
                      {MACHINE_TYPE_LABEL[t as keyof typeof MACHINE_TYPE_LABEL] ?? t}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <label className="mt-4 block text-[11px] text-muted-foreground">
              Notes
              <textarea
                className={`${inputCls} h-20`}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </label>
            <label className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Currently employed and available for assignment
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button className={btn.secondary} onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className={btn.primary} onClick={save} disabled={busy}>
                {busy ? "Saving…" : editing ? "Save changes" : "Add driver"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
