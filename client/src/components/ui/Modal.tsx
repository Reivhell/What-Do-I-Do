import { type ReactNode, useEffect, useRef } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-900/35"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={ref}
        className="relative z-10 w-full max-w-lg rounded-t-[--radius-lg] bg-clay-surface p-6 clay-l2 sm:rounded-[--radius-lg] sm:m-4"
      >
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-ink-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="tap-target rounded-[--radius-sm] text-ink-300 hover:bg-blue-50 hover:text-ink-900 clay-transition"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
