import { useRef, useEffect, useState, type ReactNode } from "react";

interface AutoFitTextProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  minSize?: number;
  maxSize?: number;
}

export default function AutoFitText({ children, className = "", style, minSize = 7, maxSize = 12 }: AutoFitTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState(maxSize);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Reset to max to measure
    el.style.fontSize = `${maxSize}px`;
    let size = maxSize;

    // Shrink until text fits or we hit minSize
    while (el.scrollWidth > el.clientWidth && size > minSize) {
      size -= 0.5;
      el.style.fontSize = `${size}px`;
    }

    setFontSize(size);
  }, [children, minSize, maxSize]);

  return (
    <span
      ref={containerRef}
      className={`block overflow-hidden whitespace-nowrap ${className}`}
      style={{ ...style, fontSize: `${fontSize}px` }}
    >
      {children}
    </span>
  );
}
