import { useState } from "react";
import Placeholder from "./Placeholder";

// Renders an image, but falls back to a labeled placeholder
// if the file isn't there yet (during local dev before product photos are saved).
export default function SmartImage({ src, alt, label, className = "", imgClassName = "" }) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return <Placeholder label={label || alt} className={className} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} ${imgClassName}`}
      onError={() => setError(true)}
    />
  );
}
