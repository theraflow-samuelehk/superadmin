// Used as a graceful fallback when product images haven't been saved yet.
export default function Placeholder({ label = "Product Image", className = "" }) {
  return (
    <div
      className={`flex items-center justify-center bg-cream-100 border border-cream-200 text-rosegold text-xs uppercase tracking-widest ${className}`}
    >
      {label}
    </div>
  );
}
