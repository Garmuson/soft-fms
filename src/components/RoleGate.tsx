import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_HOME, type Role } from "@/lib/fleet";
import { SkeletonCards } from "@/components/kit";

export function RoleGate({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { role, loading } = useAuth();
  if (loading) return <SkeletonCards count={6} />;
  if (!role || !allow.includes(role)) {
    return (
      <div className="panel p-8 text-center">
        <h1 className="text-sm font-semibold">This screen isn't part of your role</h1>
        <p className="mx-auto mt-2 max-w-sm text-xs text-muted-foreground">
          Your YM-FMS account doesn't have access to this area. Return to your own dashboard to
          continue working.
        </p>
        {role && (
          <Link to={ROLE_HOME[role]} className="mt-4 inline-block text-xs text-blue hover:underline">
            Go to my dashboard
          </Link>
        )}
      </div>
    );
  }
  return <>{children}</>;
}
