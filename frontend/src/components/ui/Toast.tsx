interface ToastProps {
  type: "success" | "error" | "info" | "warning";
  message: string;
}

const toastClasses = {
  success:
    "bg-green-50 text-green-800 border-green-200",
  error:
    "bg-red-50 text-red-800 border-red-200",
  info:
    "bg-blue-50 text-blue-800 border-blue-200",
  warning:
    "bg-amber-50 text-amber-800 border-amber-200",
};

export const Toast = ({ type, message }: ToastProps) => {
  return (
    <div
      className={`fixed bottom-4 right-4 flex items-center gap-3 rounded-md border px-4 py-3 text-sm shadow-lg ${toastClasses[type]}`}
    >
      <span className="font-medium">{message}</span>
    </div>
  );
};

interface ToastManagerProps {
  toast: { type: "success" | "error" | "info" | "warning"; message: string } | null;
}

export const ToastManager = ({ toast }: ToastManagerProps) => {
  if (!toast) return null;
  return <Toast type={toast.type} message={toast.message} />;
};
