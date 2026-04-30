import { Star } from "lucide-react";

export default function Stars({ count = 5, size = 14, className = "" }) {
  return (
    <div className={`flex gap-0.5 ${className}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          fill={i < count ? "#B7855E" : "transparent"}
          stroke={i < count ? "#B7855E" : "#B7855E"}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}
