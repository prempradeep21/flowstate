import { create } from "zustand";

export type AppToastVariant = "success" | "error";

export interface AppToast {
  id: number;
  message: string;
  variant: AppToastVariant;
}

interface AppToastState {
  toast: AppToast | null;
  showToast: (message: string, variant?: AppToastVariant) => void;
  dismissToast: () => void;
}

let dismissTimer: ReturnType<typeof setTimeout> | null = null;

export const useAppToastStore = create<AppToastState>((set, get) => ({
  toast: null,
  showToast: (message, variant = "success") => {
    if (dismissTimer) clearTimeout(dismissTimer);
    const id = Date.now();
    set({ toast: { id, message, variant } });
    const duration = variant === "error" ? 6000 : 2800;
    dismissTimer = setTimeout(() => {
      if (get().toast?.id === id) {
        set({ toast: null });
      }
    }, duration);
  },
  dismissToast: () => {
    if (dismissTimer) clearTimeout(dismissTimer);
    dismissTimer = null;
    set({ toast: null });
  },
}));

export function showAppToast(
  message: string,
  variant: AppToastVariant = "success",
): void {
  useAppToastStore.getState().showToast(message, variant);
}

export function showAppErrorToast(message: string): void {
  showAppToast(message, "error");
}
