type ButtonProps = {
  label?: string;
};

export function Button({ label = "Primary action" }: ButtonProps) {
  const buttonStyles = {
    backgroundColor: "#13544A",
    color: "#F8FAFC",
    padding: "12px",
    borderRadius: "6px",
    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.24)",
  };

  return (
    <button className="inline-flex items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500 px-5 py-3 font-medium text-white transition hover:bg-emerald-400" style={buttonStyles}>
      {label}
    </button>
  );
}