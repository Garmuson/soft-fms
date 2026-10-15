import { Children, useState, type ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { btn } from "@/components/kit";

/**
 * On phones shows one child (one question) per screen with Back / Next.
 * The last child should be the submit action. On larger screens renders all children.
 */
export function MobileSteps({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const steps = Children.toArray(children).filter(Boolean);
  const [i, setI] = useState(0);
  if (!isMobile) return <div className="space-y-4">{steps}</div>;
  const last = i >= steps.length - 1;
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="num text-sm text-muted-foreground">
          Step {i + 1} of {steps.length}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
          <div className="h-full bg-primary transition-all" style={{ width: `${((i + 1) / steps.length) * 100}%` }} />
        </div>
      </div>
      <div className="min-h-[40vh]">{steps[i]}</div>
      {!last && (
        <div className="sticky bottom-[76px] z-10 mt-4 grid grid-cols-[auto_1fr] gap-2 bg-surface pt-2">
          <button type="button" className={`${btn.secondary} justify-center`} disabled={i === 0} onClick={() => setI(i - 1)}>
            Back
          </button>
          <button type="button" className={`${btn.primary} justify-center`} onClick={() => setI(i + 1)}>
            Next
          </button>
        </div>
      )}
      {last && i > 0 && (
        <button type="button" className="mt-3 w-full text-sm text-blue underline" onClick={() => setI(i - 1)}>
          Back
        </button>
      )}
    </div>
  );
}
