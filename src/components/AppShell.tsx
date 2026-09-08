import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bell,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  Cog,
  Cpu,
  Database,
  UserCog,
  Fuel,
  Gauge,
  History,
  LogOut,
  Map as MapIcon,
  MapPin,
  Menu,
  ShieldCheck,
  Truck,
  Users,
  Zap,
  FileText,
  ListChecks,
  AlertTriangle,
  Wrench,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { alertsQuery, hubsQuery, machinesQuery } from "@/lib/api";
import { ROLE_LABEL, rollupHubs, timeAgo, utilColor, type Role } from "@/lib/fleet";
import { LiveIndicator } from "@/components/kit";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof Zap };
type NavSection = { title: string; items: NavItem[] };

const NAV: Record<Role, NavSection[]> = {
  hq_admin: [
    {
      title: "Command",
      items: [
        { to: "/dashboard", label: "Live Overview", icon: Zap },
        { to: "/hubs", label: "All 19 Hubs", icon: MapIcon },
        { to: "/fleet", label: "Fleet Register", icon: Truck },
      ],
    },
    {
      title: "Operations",
      items: [
        { to: "/alerts", label: "Alerts", icon: Bell },
        { to: "/projects", label: "Projects", icon: ClipboardList },
        { to: "/fuel", label: "Fuel Overview", icon: Fuel },
        { to: "/geofences", label: "Geofences", icon: MapPin },
        { to: "/idling", label: "Idling & Speeding", icon: Gauge },
      ],
    },
    {
      title: "Drivers",
      items: [
        { to: "/drivers", label: "Driver Registry", icon: Users },
        { to: "/driver-assignments", label: "Assignments", icon: UserCog },
      ],
    },
    {
      title: "Data entry",
      items: [
        { to: "/data-entry", label: "Enter Data", icon: Database },
        { to: "/review-queue", label: "Review Queue", icon: ClipboardCheck },
      ],
    },
    {
      title: "Administration",
      items: [
        { to: "/reports", label: "Reports", icon: BarChart3 },
        { to: "/devices", label: "Device Register", icon: Cpu },
        { to: "/users", label: "Users", icon: Users },
        { to: "/activity", label: "Activity Log", icon: History },
        { to: "/settings", label: "Settings", icon: Cog },
        { to: "/handbook", label: "Handbook", icon: BookOpen },
      ],
    },
  ],
  hub_supervisor: [
    {
      title: "My Hub",
      items: [
        { to: "/hub-dashboard", label: "Hub Dashboard", icon: Gauge },
        { to: "/my-machines", label: "My Machines", icon: Truck },
        { to: "/work-orders", label: "Work Orders", icon: ClipboardList },
      ],
    },
    {
      title: "Drivers",
      items: [
        { to: "/drivers", label: "Driver Registry", icon: Users },
        { to: "/driver-assignments", label: "Assignments", icon: UserCog },
      ],
    },
    {
      title: "Operations",
      items: [
        { to: "/data-entry", label: "Enter Data", icon: Database },
        { to: "/fuel-log", label: "Fuel Log", icon: Fuel },
        { to: "/hub-alerts", label: "Alerts", icon: Bell },
        { to: "/geofences", label: "Geofences", icon: MapPin },
        { to: "/idling", label: "Idling & Speeding", icon: Gauge },
        { to: "/devices", label: "Devices", icon: Cpu },
        { to: "/hub-reports", label: "Hub Reports", icon: FileText },
        { to: "/handbook", label: "Handbook", icon: BookOpen },
      ],
    },
  ],
  field_operator: [
    {
      title: "Shift",
      items: [
        { to: "/operator-dashboard", label: "My Machines", icon: Truck },
        { to: "/tasks", label: "Today's Tasks", icon: ListChecks },
        { to: "/inspect", label: "Inspection", icon: ShieldCheck },
        { to: "/fuel-entry", label: "Fuel Entry", icon: Fuel },
        { to: "/incident", label: "Incident", icon: AlertTriangle },
      ],
    },
    {
      title: "Help",
      items: [{ to: "/handbook", label: "Handbook", icon: BookOpen }],
    },
  ],
  ministry_analyst: [
    {
      title: "National",
      items: [
        { to: "/analytics", label: "National Overview", icon: Zap },
        { to: "/hubs", label: "All 19 Hubs", icon: MapIcon },
        { to: "/fleet", label: "Fleet Register", icon: Truck },
      ],
    },
    {
      title: "Insight",
      items: [
        { to: "/scorecards", label: "Hub Scorecards", icon: BarChart3 },
        { to: "/reports", label: "Reports", icon: FileText },
        { to: "/drivers", label: "Driver Registry", icon: Users },
        { to: "/alerts", label: "Alerts", icon: Bell },
        { to: "/idling", label: "Idling & Speeding", icon: Gauge },
        { to: "/geofences", label: "Geofences", icon: MapPin },
        { to: "/devices", label: "Device Register", icon: Cpu },
        { to: "/activity", label: "Activity Log", icon: History },
        { to: "/handbook", label: "Handbook", icon: BookOpen },
      ],
    },
  ],
  data_entry_supervisor: [
    {
      title: "Data office",
      items: [
        { to: "/review-queue", label: "Review Queue", icon: ClipboardCheck },
        { to: "/data-entry", label: "Enter Data", icon: Database },
      ],
    },
    {
      title: "Drivers",
      items: [
        { to: "/drivers", label: "Driver Registry", icon: Users },
        { to: "/driver-assignments", label: "Assignments", icon: UserCog },
      ],
    },
    {
      title: "Records",
      items: [
        { to: "/fuel", label: "Fuel Overview", icon: Fuel },
        { to: "/projects", label: "Projects", icon: ClipboardList },
        { to: "/fleet", label: "Fleet Register", icon: Truck },
        { to: "/hubs", label: "All 19 Hubs", icon: MapIcon },
        { to: "/activity", label: "Activity Log", icon: History },
        { to: "/handbook", label: "Handbook", icon: BookOpen },
      ],
    },
  ],
  data_entry_staff: [
    {
      title: "My hub",
      items: [
        { to: "/data-entry", label: "Enter Data", icon: Database },
        { to: "/drivers", label: "Driver Registry", icon: Users },
        { to: "/driver-assignments", label: "Assignments", icon: UserCog },
      ],
    },
    {
      title: "Reference",
      items: [
        { to: "/my-machines", label: "Hub Machines", icon: Truck },
        { to: "/handbook", label: "Handbook", icon: BookOpen },
      ],
    },
  ],
};


function useOnline() {
  const [online, setOnline] = useState(true);
  const [justBack, setJustBack] = useState(false);
  useEffect(() => {
    setOnline(navigator.onLine);
    const up = () => {
      setOnline(true);
      setJustBack(true);
      setTimeout(() => setJustBack(false), 3000);
    };
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  return { online, justBack };
}

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, role, hubId, readOnly } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [seen, setSeen] = useState<string[]>([]);
  const { online, justBack } = useOnline();

  const scope = role === "hq_admin" || role === "ministry_analyst" ? null : hubId;
  const { data: hubs = [] } = useQuery(hubsQuery());
  const { data: machines = [] } = useQuery(machinesQuery(scope));
  const { data: alerts = [] } = useQuery(alertsQuery(scope));

  const unread = alerts.filter((a) => !a.is_acknowledged && !seen.includes(a.id));
  const rollups = useMemo(() => rollupHubs(hubs, machines, alerts), [hubs, machines, alerts]);
  const myHub = hubs.find((h) => h.id === hubId);

  // Realtime: new alerts + machine status changes
  useEffect(() => {
    const channel = supabase
      .channel("ymfms-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts" }, (payload) => {
        const a = payload.new as { level: string; message: string; hub_id: number };
        if (scope && a.hub_id !== scope) return;
        qc.invalidateQueries({ queryKey: ["alerts"] });
        if (a.level === "critical") toast.error("Critical alert", { description: a.message });
        else toast.warning("New alert", { description: a.message });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "machines" }, (payload) => {
        const m = payload.new as { hub_id: number; unit_id: string; status: string };
        const old = payload.old as { status?: string };
        if (scope && m.hub_id !== scope) return;
        qc.invalidateQueries({ queryKey: ["machines"] });
        if (old?.status && old.status !== m.status && m.status === "alert") {
          toast.error(`${m.unit_id} moved to alert status`);
        }
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc, scope]);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const sections = role ? NAV[role] : [];
  const initials = (profile?.full_name || profile?.email || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const context =
    role === "hub_supervisor"
      ? `${myHub?.name ?? "My Hub"} — ${myHub?.county ?? ""}`
      : role === "field_operator"
        ? "Field Operations · Today's Shift"
        : "Fleet Command · All 19 Hubs";

  const isOperator = role === "field_operator";

  return (
    <div className="min-h-screen bg-background">
      {!online && (
        <div className="sticky top-0 z-50 bg-amber-dim px-4 py-1.5 text-center text-xs text-amber">
          Connection lost — showing cached data. Reconnecting…
        </div>
      )}
      {justBack && (
        <div className="sticky top-0 z-50 bg-green-dim px-4 py-1.5 text-center text-xs text-teal">
          Reconnected
        </div>
      )}

      <header className="sticky top-0 z-40 flex h-[52px] items-center gap-3 border-b border-border bg-surface px-3">
        {!isOperator && (
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
            aria-label="Toggle navigation"
          >
            <Menu className="size-4" />
          </button>
        )}
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-md bg-green-dim text-[13px]">
            🚜
          </span>
          <span className="text-sm font-semibold tracking-tight">YM-FMS</span>
        </Link>
        <span className="hidden h-5 w-px bg-border sm:block" />
        <span className="hidden truncate text-xs text-muted-foreground sm:block">{context}</span>
        {readOnly && (
          <span className="rounded-full bg-blue-dim px-2 py-0.5 text-[10px] font-medium text-blue">
            Read Only
          </span>
        )}
        <div className="flex-1" />
        <span className="hidden md:block">
          <LiveIndicator />
        </span>
        <button
          onClick={() => setDrawer(true)}
          className="relative rounded-md p-1.5 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          aria-label={`Notifications, ${unread.length} unread`}
        >
          <Bell className="size-4" />
          {unread.length > 0 && (
            <span className="num absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-red px-1 text-[9px] text-white">
              {unread.length}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2 pl-1">
          <span className="grid size-7 place-items-center rounded-full border border-border bg-surface-2 text-[10px] font-semibold">
            {initials}
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-xs font-medium">{profile?.full_name || "User"}</span>
            <span className="block text-[10px] text-muted-foreground">
              {role ? ROLE_LABEL[role] : ""}
            </span>
          </span>
        </div>
        <button
          onClick={signOut}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-2 hover:text-red"
          aria-label="Sign out"
        >
          <LogOut className="size-4" />
        </button>
      </header>

      <div className="flex">
        {!isOperator && (
          <nav
            className={cn(
              "sticky top-[52px] hidden h-[calc(100vh-52px)] shrink-0 overflow-y-auto border-r border-border bg-surface py-3 md:block",
              collapsed ? "w-[52px]" : "w-[210px]",
            )}
            aria-label="Main navigation"
          >
            {sections.map((sec) => (
              <div key={sec.title} className="mb-4">
                {!collapsed && (
                  <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {sec.title}
                  </p>
                )}
                <ul>
                  {sec.items.map((item) => {
                    const active = pathname === item.to;
                    const badge = item.label === "Alerts" ? unread.length : 0;
                    return (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          className={cn(
                            "mx-1.5 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
                            active
                              ? "bg-green-dim text-teal"
                              : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                          )}
                          title={item.label}
                        >
                          <item.icon className="size-4 shrink-0" aria-hidden />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                          {!collapsed && badge > 0 && (
                            <span className="num ml-auto rounded-full bg-red px-1.5 text-[9px] text-white">
                              {badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            {!collapsed && role !== "hub_supervisor" && rollups.length > 0 && (
              <div className="mb-4">
                <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Quick hubs
                </p>
                <ul>
                  {rollups.slice(0, 8).map((h) => (
                    <li key={h.id}>
                      <Link
                        to="/hub/$id"
                        params={{ id: String(h.id) }}
                        className="mx-1.5 flex items-center gap-2 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                      >
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ background: utilColor(h.utilization) }}
                        />
                        <span className="truncate">
                          {h.name} · {h.county}
                        </span>
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      to="/hubs"
                      className="mx-1.5 block px-2 py-1 text-[11px] text-blue hover:underline"
                    >
                      Show all 19
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </nav>
        )}

        <main className="min-w-0 flex-1">
          <div
            className={cn(
              "mx-auto max-w-[1400px] p-5",
              isOperator && "max-w-2xl pb-24 p-4",
            )}
          >
            {children}
          </div>
        </main>
      </div>

      {/* Mobile / operator bottom tab bar */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 flex justify-around border-t border-border bg-surface py-1.5",
          isOperator ? "flex" : "flex md:hidden",
        )}
        aria-label="Mobile navigation"
      >
        {sections.flatMap((s) => s.items).slice(0, 5).map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-w-16 flex-col items-center gap-0.5 rounded-md px-2 py-1 text-[10px]",
                active ? "text-teal" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-5" aria-hidden />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {drawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={() => setDrawer(false)}>
          <aside
            className="h-full w-full max-w-sm overflow-y-auto border-l border-border bg-surface"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Notifications</h2>
              <div className="flex items-center gap-2">
                <button
                  className="text-[11px] text-blue hover:underline"
                  onClick={() => setSeen(alerts.map((a) => a.id))}
                >
                  Mark all as read
                </button>
                <button onClick={() => setDrawer(false)} aria-label="Close notifications">
                  <X className="size-4 text-muted-foreground" />
                </button>
              </div>
            </header>
            {alerts.length === 0 ? (
              <p className="p-6 text-center text-xs text-muted-foreground">
                No notifications yet. Alerts from your machines will appear here.
              </p>
            ) : (
              <ul>
                {alerts.slice(0, 20).map((a) => {
                  const hub = hubs.find((h) => h.id === a.hub_id);
                  return (
                    <li
                      key={a.id}
                      className="flex gap-2.5 border-b border-border px-4 py-3 hover:bg-surface-2"
                    >
                      <Wrench className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-xs text-foreground">{a.message}</p>
                        <p className="num mt-0.5 text-[10px] text-muted-foreground">
                          {hub?.name} · {hub?.county} · {timeAgo(a.created_at)}
                        </p>
                        <Link
                          to="/hub/$id"
                          params={{ id: String(a.hub_id) }}
                          onClick={() => setDrawer(false)}
                          className="text-[10px] text-blue hover:underline"
                        >
                          Open hub
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
