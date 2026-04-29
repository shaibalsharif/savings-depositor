"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Crumb = { label: string; href?: string };

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-1.5 mb-6">
      <button
        onClick={() => router.back()}
        className="flex items-center justify-center rounded-lg mr-1 transition-colors"
        style={{
          width: 30,
          height: 30,
          background: "hsl(var(--accent))",
          color: "hsl(var(--muted-foreground))",
          border: "none",
          cursor: "pointer",
        }}
        aria-label="Go back"
      >
        <ChevronLeft size={16} />
      </button>

      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <ChevronRight size={13} style={{ color: "hsl(var(--muted-foreground))", opacity: 0.5 }} />
            )}
            {crumb.href && !isLast ? (
              <Link
                href={crumb.href}
                className="text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                className="text-sm font-semibold"
                style={{ color: isLast ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
              >
                {crumb.label}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
