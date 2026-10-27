import { Star } from "lucide-react";

export default function RatingStars({ value = 0, onChange, size = 16, interactive = false }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-0.5">
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          disabled={!interactive}
          onClick={() => onChange && onChange(s)}
          className={interactive ? "cursor-pointer" : "cursor-default"}
          aria-label={`${s} star${s > 1 ? "s" : ""}`}
        >
          <Star
            size={size}
            className={s <= Math.round(value) ? "fill-amber-400 text-amber-400" : "fill-transparent text-slate-300"}
          />
        </button>
      ))}
    </div>
  );
}
