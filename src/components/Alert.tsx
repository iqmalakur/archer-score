"use client";

import React, { useEffect, useId, useRef } from "react";

export interface AlertProps {
  title: string;
  show: boolean;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: "warning" | "success" | "danger" | "info";
  pending?: boolean;
  fallbackFocusRef?: React.RefObject<HTMLElement | null>;
  onCancel?: () => void;
  onDismiss?: () => void;
  onConfirm?: () => void | Promise<void>;
}

const typeConfig: Record<
  NonNullable<AlertProps["type"]>,
  {
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
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
    iconColor: "text-amber-800 dark:text-amber-300",
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
    iconColor: "text-red-700 dark:text-red-300",
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
    iconColor: "text-emerald-700 dark:text-emerald-300",
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
    iconColor: "text-sky-700 dark:text-sky-300",
  },
};

export const Alert = ({
  title,
  show,
  message,
  confirmText = "Konfirmasi",
  cancelText = "Batal",
  type = "warning",
  pending = false,
  fallbackFocusRef,
  onCancel,
  onDismiss,
  onConfirm,
}: AlertProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!show || !dialog) return;
    const trigger = document.activeElement;
    const fallback = fallbackFocusRef?.current;

    dialog.showModal();

    return () => {
      if (dialog.open) dialog.close();
      if (trigger instanceof HTMLElement && trigger.isConnected && trigger !== document.body) {
        trigger.focus();
      } else if (fallback?.isConnected) {
        fallback.focus();
      }
    };
  }, [show, fallbackFocusRef]);

  if (!show) {
    return null;
  }

  const { icon, iconBg, iconColor } = typeConfig[type];
  const confirmColor = type === "danger"
    ? "bg-red-700 text-white dark:bg-red-300 dark:text-red-950"
    : "bg-primary text-on-primary";

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-busy={pending}
      aria-labelledby={titleId}
      aria-describedby={message ? messageId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) (onDismiss ?? onCancel)?.();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab" || pending) return;
        const boundary = event.shiftKey ? cancelRef.current : confirmRef.current;
        if (document.activeElement !== boundary) return;
        event.preventDefault();
        (event.shiftKey ? confirmRef.current : cancelRef.current)?.focus();
      }}
      className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[calc(100dvh_-_1rem)] w-full
        max-w-none overflow-y-auto overscroll-contain rounded-t-3xl border border-line bg-surface
        p-5 pb-[calc(1.25rem_+_env(safe-area-inset-bottom))] text-ink shadow-2xl
        backdrop:bg-black/55 sm:inset-0 sm:m-auto sm:w-[calc(100%_-_2rem)] sm:max-w-md
        sm:rounded-2xl sm:p-6"
    >
      <div className="flex flex-col items-start gap-4">
        <span
          className={`grid size-10 place-items-center rounded-xl ${iconBg} ${iconColor}`}
        >
          {icon}
        </span>

        <div>
          <h2 id={titleId} className="wrap-anywhere text-xl font-bold tracking-tight text-ink">
            {title}
          </h2>
          {message && (
            <p id={messageId} className="mt-2 wrap-anywhere text-sm leading-relaxed text-ink-muted">
              {message}
            </p>
          )}
        </div>

        <div className="mt-1 grid w-full grid-cols-2 gap-2 sm:gap-3">
          <button
            ref={cancelRef}
            type="button"
            disabled={pending}
            className="min-h-11 cursor-pointer rounded-xl border border-line bg-surface px-2 py-2
              text-sm font-semibold text-ink hover:bg-surface-muted disabled:cursor-wait disabled:opacity-60"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            ref={confirmRef}
            type="button"
            disabled={pending}
            className={`min-h-11 cursor-pointer rounded-xl px-2 py-2 text-sm font-semibold
              hover:brightness-110 disabled:cursor-wait disabled:opacity-60 ${confirmColor}`}
            onClick={onConfirm}
          >
            <span role={pending ? "status" : undefined}>
              {pending ? "Memproses..." : confirmText}
            </span>
          </button>
        </div>
      </div>
    </dialog>
  );
};
