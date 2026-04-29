"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { X } from "lucide-react";

export function SlideModal({
  title,
  children,
  backHref,
}: {
  title: string;
  children: React.ReactNode;
  backHref: string;
}) {
  const router = useRouter();

  function close() {
    router.push(backHref);
  }

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        onClick={close}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 z-50 h-full overflow-y-auto"
        style={{
          width: "min(480px, 100vw)",
          background: "hsl(222 47% 9%)",
          borderLeft: "1px solid hsl(var(--border))",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.5)",
          animation: "slideIn 0.25s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
          style={{
            background: "hsl(222 47% 9%)",
            borderBottom: "1px solid hsl(var(--border))",
          }}
        >
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={close}
            className="flex items-center justify-center rounded-lg w-8 h-8 transition-colors"
            style={{ background: "hsl(var(--accent))" }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">{children}</div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
