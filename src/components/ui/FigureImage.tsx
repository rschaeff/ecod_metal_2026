'use client';

import { useState } from 'react';

interface FigureImageProps {
  src: string;
  alt: string;
  label: string;        // e.g., "Fig 2A"
  description?: string; // shown in placeholder when image is missing
  className?: string;
  imgClassName?: string;
}

// Render a figure image with a graceful fallback when the asset file is not
// present in /public. Public-deposition pages reference paper PNGs by path,
// but those PNGs may not be checked in yet — the fallback keeps the page
// reading coherently in the meantime.
export default function FigureImage({
  src,
  alt,
  label,
  description,
  className,
  imgClassName,
}: FigureImageProps) {
  const [missing, setMissing] = useState(false);

  if (missing) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center ${className ?? ''}`}
        role="img"
        aria-label={`${label} placeholder — image asset pending`}
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {label}
        </p>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Figure asset pending.
        </p>
        {description && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-500 max-w-md">
            {description}
          </p>
        )}
        <p className="mt-2 text-[11px] font-mono text-gray-400 dark:text-gray-500">
          expected at <span className="select-all">{src}</span>
        </p>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setMissing(true)}
      className={imgClassName ?? `max-w-full h-auto ${className ?? ''}`}
    />
  );
}
