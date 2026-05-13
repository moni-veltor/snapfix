import { type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type ReactNode, forwardRef } from "react";

const BASE =
  "block w-full rounded-md border border-line bg-surface-1 text-ink placeholder:text-soft focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60";

const SIZE = "px-3 py-2 text-sm";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...rest }, ref) {
    return <input ref={ref} {...rest} className={`${BASE} ${SIZE} ${className}`} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = "", rows = 3, ...rest }, ref) {
    return <textarea ref={ref} rows={rows} {...rest} className={`${BASE} ${SIZE} ${className}`} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = "", children, ...rest }, ref) {
    return (
      <select ref={ref} {...rest} className={`${BASE} ${SIZE} ${className}`}>
        {children}
      </select>
    );
  },
);

/**
 * A labelled form field — label + hint + control + error. Consistent layout
 * across all admin forms.
 */
type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
};

export function FormField({ label, hint, error, required, htmlFor, children, className = "" }: FieldProps) {
  return (
    <label htmlFor={htmlFor} className={`block ${className}`}>
      <span className="text-xs font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      {hint && <span className="mt-0.5 block text-[11px] text-muted">{hint}</span>}
      <div className="mt-1.5">{children}</div>
      {error && <span className="mt-1 block text-[11px] text-rose-600 dark:text-rose-400">{error}</span>}
    </label>
  );
}
