"use client";

import { type ReactNode } from "react";
import { withToast } from "@/lib/toast-action";

type ServerAction = (formData: FormData) => Promise<unknown>;

type ToastOptions = Parameters<typeof withToast>[1];

type Props = {
  action: ServerAction;
  toast: ToastOptions;
  className?: string;
  children: ReactNode;
};

/**
 * Drop-in `<form>` replacement that wraps the server action with Sonner
 * toasts (success + error, handling Next.js redirect signals correctly).
 * Lets us decorate server-rendered forms with feedback without forcing
 * the parent into client-component territory.
 *
 *   <ToastForm
 *     action={approveIBSAction}
 *     toast={{ success: "IBS approved", error: "Couldn't approve IBS" }}
 *   >
 *     <input type="hidden" name="id" value={ibs.id} />
 *     <SubmitButton tone="ok">Approve</SubmitButton>
 *   </ToastForm>
 */
export default function ToastForm({
  action,
  toast,
  className,
  children,
}: Props) {
  return (
    <form action={withToast(action, toast)} className={className}>
      {children}
    </form>
  );
}
