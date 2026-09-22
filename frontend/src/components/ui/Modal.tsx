import { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${sizeClasses[size]} rounded-lg bg-white p-6 shadow-xl`}
      >
        {title && (
          <h2 className="mb-4 text-lg font-semibold text-slate-800">{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
};

export default Modal;
