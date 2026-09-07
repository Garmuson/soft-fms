import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Role } from "@/lib/fleet";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  hub_id: number | null;
  is_active: boolean;
};

type AuthValue = {
  user: User | null;
  profile: Profile | null;
  role: Role | null;
  hubId: number | null;
  loading: boolean;
  readOnly: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthValue>({
  user: null,
  profile: null,
  role: null,
  hubId: null,
  loading: true,
  readOnly: false,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(uid: string) {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("id,email,full_name,hub_id,is_active").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid).limit(1).maybeSingle(),
    ]);
    setProfile((p as Profile | null) ?? null);
    setRole(((r?.role as Role | undefined) ?? null) as Role | null);
    setLoading(false);
  }

  async function refresh() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user ?? null);
    if (data.user) await load(data.user.id);
    else setLoading(false);
  }

  useEffect(() => {
    let mounted = true;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        void load(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setProfile(null);
        setRole(null);
        setLoading(false);
      }
    });
    void refresh();
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        hubId: profile?.hub_id ?? null,
        loading,
        readOnly: role === "ministry_analyst",
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
