export default function LoadingSpinner({ size = 32, className = "" }) {
  return (
    <div className={`flex items-center justify-center ${className}`} role="status" aria-label="Loading">
      <div
        className="animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
