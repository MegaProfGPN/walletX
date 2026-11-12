"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AuthState } from "@/lib/auth/actions";

type Action = (state: AuthState, formData: FormData) => Promise<AuthState>;

const initialState: AuthState = {};

export function AuthForm({
  action,
  title,
  description,
  submitLabel,
  fields,
  footer,
  notice,
}: {
  action: Action;
  title: string;
  description?: string;
  submitLabel: string;
  fields: {
    name: string;
    label: string;
    type: string;
    autoComplete?: string;
    placeholder?: string;
    required?: boolean;
  }[];
  footer?: { href: string; label: string }[];
  notice?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>

      {notice ? (
        <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{notice}</p>
      ) : null}

      {state.error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-expense">
          {state.error}
        </p>
      ) : null}

      {state.message ? (
        <p role="status" className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
          {state.message}
        </p>
      ) : null}

      {fields.map((field) => (
        <label key={field.name} className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink">{field.label}</span>
          <input
            name={field.name}
            type={field.type}
            required={field.required ?? true}
            autoComplete={field.autoComplete}
            placeholder={field.placeholder}
            className="min-h-11 rounded-lg border border-line bg-surface px-3 text-base text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </label>
      ))}

      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-lg bg-brand-600 px-4 text-base font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "Memproses..." : submitLabel}
      </button>

      {footer
        ? footer.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-center text-sm text-brand-600 underline"
            >
              {item.label}
            </Link>
          ))
        : null}
    </form>
  );
}
