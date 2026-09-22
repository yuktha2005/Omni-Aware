import { useState, useCallback } from "react";

type ToastType = "success" | "error" | "info" | "warning";

export const useToast = () => {
  const [toast, setToast] = useState<{
    type: ToastType;
    message: string;
  } | null>(null);

  const showToast = useCallback(
    (type: ToastType, message: string, duration = 4000) => {
      setToast({ type, message });
      setTimeout(() => setToast(null), duration);
    },
    []
  );

  return { toast, showToast };
};
