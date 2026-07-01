import { useEffect } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { dismissToast, type ToastItem } from "@/store/slices/uiSlice";
import { cn } from "@/lib/utils";

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  default: Info,
} as const;

const ACCENTS = {
  success: "border-cyan-500/30 [&_svg]:text-cyan-400",
  error: "border-rose-500/30 [&_svg]:text-rose-500",
  warning: "border-amber-500/30 [&_svg]:text-amber-500",
  default: "border-violet-500/30 [&_svg]:text-violet-400",
} as const;

function ToastCard({ id, variant, title, description }: ToastItem) {
  const dispatch = useAppDispatch();
  const Icon = ICONS[variant];

  useEffect(() => {
    const t = setTimeout(() => dispatch(dismissToast(id)), 6000);
    return () => clearTimeout(t);
  }, [id, dispatch]);

  return (
    <div
      role="status"
      className={cn(
        "glass pointer-events-auto flex w-80 items-start gap-3 border p-4 shadow-glass animate-in slide-in-from-right-4 fade-in-0",
        ACCENTS[variant]
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{title}</p>
        {description && <p className="mt-0.5 text-xs text-mist break-words">{description}</p>}
      </div>
      <button
        onClick={() => dispatch(dismissToast(id))}
        className="text-mist hover:text-white transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useAppSelector((s) => s.ui.toasts);
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastCard key={t.id} {...t} />
      ))}
    </div>
  );
}
