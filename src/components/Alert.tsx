import React from "react";

export interface AlertProps {
  title: string;
  show: boolean;
  message?: string;
  type?: "warning" | "success" | "danger" | "info";
  onCancel: () => void;
  onConfirm?: () => void;
}

const typeConfig: Record<
  NonNullable<AlertProps["type"]>,
  {
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    confirmBtn: string;
  }
> = {
  warning: {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        stroke="currentColor"
        className="h-5 w-5"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
        />
      </svg>
    ),
    iconBg: "bg-amber-100 dark:bg-amber-500/20",
    iconColor: "text-amber-500",
    confirmBtn:
      "bg-amber-500 shadow-amber-500/30",
  },
  danger: {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        stroke="currentColor"
        className="h-5 w-5"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
    ),
    iconBg: "bg-red-100 dark:bg-red-500/20",
    iconColor: "text-red-500",
    confirmBtn: "bg-red-500 shadow-red-500/30",
  },
  success: {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        stroke="currentColor"
        className="h-5 w-5"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
    ),
    iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
    iconColor: "text-emerald-500",
    confirmBtn: "bg-emerald-500 shadow-emerald-500/30",
  },
  info: {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        stroke="currentColor"
        className="h-5 w-5"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
        />
      </svg>
    ),
    iconBg: "bg-sky-100 dark:bg-sky-500/20",
    iconColor: "text-sky-500",
    confirmBtn: "bg-sky-500 shadow-sky-500/30",
  },
};

export const Alert = ({
  title,
  show,
  message,
  type = "warning",
  onCancel,
  onConfirm,
}: AlertProps) => {
  if (!show) {
    return null;
  }

  const { icon, iconBg, iconColor, confirmBtn } = typeConfig[type];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      style={{ animation: "overlayFadeIn 0.2s ease-out both" }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl sm:p-8"
        style={{ animation: "dialogScaleIn 0.25s ease-out both" }}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-full ${iconBg} ${iconColor}`}
          >
            {icon}
          </span>

          <div>
            <h2 className="text-lg font-semibold text-ink sm:text-xl">
              {title}
            </h2>
            {message && (
              <p className="mt-1 text-sm text-ink-muted">{message}</p>
            )}
          </div>

          <div className="flex w-full gap-3">
            <button
              className="flex-1 rounded-xl border border-line bg-surface px-6 py-3 font-semibold text-ink-muted transition-all hover:bg-surface-muted"
              onClick={onCancel}
            >
              Batal
            </button>
            <button
              className={`flex-1 rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition-all hover:brightness-110 active:scale-[0.97] ${confirmBtn}`}
              onClick={onConfirm}
            >
              Konfirmasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};