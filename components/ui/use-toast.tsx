// Adapted from shadcn/ui (https://ui.shadcn.com/docs/components/toast)
import { useState, useEffect, useContext, createContext } from "react";

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 1000;

type ToasterToast = {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "success";
  duration?: number;
};

type ToastActionElement = React.ReactElement;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ToastContextType = {
  toasts: ToasterToast[];
  addToast: (toast: Omit<ToasterToast, "id">) => string;
  dismissToast: (toastId: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToasterToast[]>([]);

  const addToast = (toast: Omit<ToasterToast, "id">) => {
    const id = genId();

    setToasts((prevToasts) => {
      const newToasts = [
        { id, ...toast },
        ...prevToasts,
      ].slice(0, TOAST_LIMIT);

      return newToasts;
    });

    return id;
  };

  const dismissToast = (toastId: string) => {
    setToasts((prevToasts) =>
      prevToasts.filter((toast) => toast.id !== toastId)
    );
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return {
    toast: (props: Omit<ToasterToast, "id">) => {
      return context.addToast(props);
    },
    dismiss: (toastId: string) => context.dismissToast(toastId),
    toasts: context.toasts,
  };
}

export type { ToasterToast, ToastActionElement };
