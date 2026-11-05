import React from 'react';

export function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" width={16} height={16} aria-hidden>
      <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

export function SnakeIcon() {
  return (
    <svg viewBox="0 0 16 16" width={16} height={16} aria-hidden>
      <path
        d="M2.75 12.25h7a1.75 1.75 0 0 0 0-3.5h-3.5a1.75 1.75 0 0 1 0-3.5h5"
        fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
      />
      <circle cx={13.25} cy={12.25} r={1.25} fill="currentColor" />
    </svg>
  );
}
