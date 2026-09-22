interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  required?: boolean;
  className?: string;
}

const Input = ({
  label,
  type = "text",
  placeholder,
  value = "",
  onChange,
  error,
  required = false,
  className = "",
}: InputProps) => {
  const inputClasses =
    "w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500";

  return (
    <div className={className}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={`${inputClasses} ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default Input;
