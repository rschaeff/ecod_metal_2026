'use client';

import { useState } from 'react';

interface CopyButtonProps {
  text: string;
  label: string;
}

export default function CopyButton({ text, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (insecure origin / older browser) —
      // fall back to a manual selection prompt.
      window.prompt('Copy with ⌘C / Ctrl-C:', text);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
    >
      {copied ? '✓ Copied' : `Copy ${label}`}
    </button>
  );
}
