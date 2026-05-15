import { toast } from "sonner";

// Form-action-compatible signature. Many of our server actions return
// `void` directly; some return data (e.g. created-id). The wrapper
// discards the value either way.
type ServerAction = (formData: FormData) => Promise<unknown>;
type FormAction = (formData: FormData) => Promise<void>;

/**
 * Next.js signals navigation by throwing a specially-flagged error from
 * inside server actions (redirect / notFound). The framework catches and
 * handles them automatically — we just need to not mistake them for real
 * failures and not show an error toast.
 */
function isNextSignal(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { digest?: unknown; message?: unknown };
  if (typeof e.digest === "string" && e.digest.startsWith("NEXT_")) return true;
  if (typeof e.message === "string" && e.message.startsWith("NEXT_")) return true;
  return false;
}

type ToastOptions = {
  loading?: string;
  success: string | ((fd: FormData) => string);
  error?: string | ((err: unknown) => string);
  /** Optional sublabel under the toast. */
  description?: string | ((fd: FormData) => string);
};

/**
 * Wrap a server action with Sonner success / error toasts. Returns a
 * drop-in replacement that can be passed to `<form action={...}>` in a
 * client component. Failures are caught and a toast is shown; the
 * underlying error is re-thrown so the React runtime still logs it.
 *
 *   <form action={withToast(approveIBSAction, { success: "IBS approved" })}>
 */
export function withToast(
  action: ServerAction,
  opts: ToastOptions,
): FormAction {
  return async (fd: FormData) => {
    const id = opts.loading ? toast.loading(opts.loading) : undefined;
    try {
      await action(fd);
      const successMsg = typeof opts.success === "function" ? opts.success(fd) : opts.success;
      const desc = opts.description
        ? typeof opts.description === "function"
          ? opts.description(fd)
          : opts.description
        : undefined;
      toast.success(successMsg, { id, description: desc });
    } catch (err) {
      // Next.js redirect / notFound throws — these aren't real failures.
      // Show success (the action did its job) and let the framework
      // continue handling the navigation.
      if (isNextSignal(err)) {
        const successMsg = typeof opts.success === "function" ? opts.success(fd) : opts.success;
        const desc = opts.description
          ? typeof opts.description === "function"
            ? opts.description(fd)
            : opts.description
          : undefined;
        toast.success(successMsg, { id, description: desc });
        throw err;
      }
      const errorMsg =
        opts.error == null
          ? "Something went wrong — please try again."
          : typeof opts.error === "function"
            ? opts.error(err)
            : opts.error;
      toast.error(errorMsg, { id });
      throw err;
    }
  };
}
