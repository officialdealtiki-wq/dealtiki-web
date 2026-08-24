import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  duration?: number;
}

let toastListener: ((toast: ToastMessage) => void) | null = null;

export function showToast(
  message: string,
  type: "success" | "error" | "info" | "warning" = "success",
  duration: number = 3000
) {
  if (toastListener) {
    toastListener({
      id: Math.random().toString(36).substring(2, 9),
      type,
      message,
      duration,
    });
  }
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    toastListener = (toast: ToastMessage) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== toast.id));
      }, toast.duration || 3000);
    };

    return () => {
      toastListener = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#161B22] border border-white/10 shadow-2xl text-slate-100 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-auto"
        >
          {toast.type === "success" && (
            <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" />
          )}
          {toast.type === "error" && (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          {toast.type === "warning" && (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          {toast.type === "info" && (
            <Info className="w-4 h-4 text-yellow-400 shrink-0" />
          )}
          <span className="flex-1 leading-snug">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};
