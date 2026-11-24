import type { ReactNode } from 'react';

export type UiIconName =
  | 'agenda'
  | 'arrow-left'
  | 'arrow-right'
  | 'bell'
  | 'cards'
  | 'dashboard'
  | 'edit'
  | 'events'
  | 'eye'
  | 'files'
  | 'groups'
  | 'help'
  | 'logout'
  | 'members'
  | 'menu'
  | 'plus'
  | 'refresh'
  | 'repertoire'
  | 'settings'
  | 'sparkles'
  | 'table'
  | 'trash'
  | 'user'
  | 'check'
  | 'x'
  | 'open';

type UiIconProps = {
  name: UiIconName;
  size?: number;
  className?: string;
};

function iconShape(name: UiIconName): ReactNode {
  if (name === 'plus') {
    return (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    );
  }

  if (name === 'refresh') {
    return (
      <>
        <path d="M20 11a8 8 0 0 0-14.6-4.3" />
        <path d="M4 4v4h4" />
        <path d="M4 13a8 8 0 0 0 14.6 4.3" />
        <path d="M20 20v-4h-4" />
      </>
    );
  }

  if (name === 'table') {
    return (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 10h18" />
        <path d="M9 4v16" />
        <path d="M15 4v16" />
      </>
    );
  }

  if (name === 'cards') {
    return (
      <>
        <rect x="3" y="6" width="8" height="12" rx="2" />
        <rect x="13" y="4" width="8" height="7" rx="2" />
        <rect x="13" y="13" width="8" height="7" rx="2" />
      </>
    );
  }

  if (name === 'eye') {
    return (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    );
  }

  if (name === 'edit') {
    return (
      <>
        <path d="M12 20h9" />
        <path d="m16.5 3.5 4 4L8 20l-5 1 1-5 12.5-12.5Z" />
      </>
    );
  }

  if (name === 'trash') {
    return (
      <>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
      </>
    );
  }

  if (name === 'arrow-left') {
    return (
      <>
        <path d="m15 18-6-6 6-6" />
        <path d="M9 12h12" />
      </>
    );
  }

  if (name === 'arrow-right') {
    return (
      <>
        <path d="m9 18 6-6-6-6" />
        <path d="M3 12h12" />
      </>
    );
  }

  if (name === 'dashboard') {
    return (
      <>
        <rect x="3" y="3" width="8" height="8" rx="2" />
        <rect x="13" y="3" width="8" height="5" rx="2" />
        <rect x="13" y="10" width="8" height="11" rx="2" />
        <rect x="3" y="13" width="8" height="8" rx="2" />
      </>
    );
  }

  if (name === 'agenda') {
    return (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4" />
        <path d="M16 3v4" />
        <path d="M3 10h18" />
      </>
    );
  }

  if (name === 'events') {
    return (
      <>
        <rect x="3" y="7" width="18" height="12" rx="2" />
        <path d="M8 7V5" />
        <path d="M16 7V5" />
        <path d="M7 13h10" />
      </>
    );
  }

  if (name === 'members') {
    return (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M3 19c.6-2.9 2.8-4.7 6-4.7s5.4 1.8 6 4.7" />
        <path d="M15 19c.4-1.9 1.7-3.2 3.7-3.2 1.8 0 2.8.9 3.3 2.2" />
      </>
    );
  }

  if (name === 'groups') {
    return (
      <>
        <path d="M4 21V7l8-4 8 4v14" />
        <path d="M9 21v-6h6v6" />
        <path d="M4 10h16" />
      </>
    );
  }

  if (name === 'repertoire') {
    return (
      <>
        <path d="M9 19V7l9-2v12" />
        <circle cx="7" cy="19" r="2" />
        <circle cx="16" cy="17" r="2" />
      </>
    );
  }

  if (name === 'files') {
    return (
      <>
        <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
      </>
    );
  }

  if (name === 'settings') {
    return (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19 12a7 7 0 0 0-.1-1.2l2.1-1.6-2-3.4-2.5 1a7 7 0 0 0-2-.9l-.4-2.6h-4l-.4 2.6a7 7 0 0 0-2 .9l-2.5-1-2 3.4 2.1 1.6a7 7 0 0 0 0 2.4L3.2 15l2 3.4 2.5-1a7 7 0 0 0 2 .9l.4 2.6h4l.4-2.6a7 7 0 0 0 2-.9l2.5 1 2-3.4-2.1-1.6c.1-.4.1-.8.1-1.2Z" />
      </>
    );
  }

  if (name === 'bell') {
    return (
      <>
        <path d="M15 17H5c1.4-1.5 2-3 2-5v-2a5 5 0 1 1 10 0v2c0 2 .6 3.5 2 5h-4" />
        <path d="M10 17a2 2 0 0 0 4 0" />
      </>
    );
  }

  if (name === 'user') {
    return (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M4 20c.7-3.2 3.2-5 8-5s7.3 1.8 8 5" />
      </>
    );
  }

  if (name === 'menu') {
    return (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </>
    );
  }

  if (name === 'sparkles') {
    return (
      <>
        <path d="m12 3 1.9 4.1L18 9l-4.1 1.9L12 15l-1.9-4.1L6 9l4.1-1.9L12 3Z" />
        <path d="m5 16 .9 1.9L8 19l-2.1 1L5 22l-1-2-2-1 2.1-1.1L5 16Z" />
      </>
    );
  }

  if (name === 'logout') {
    return (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17l5-5-5-5" />
        <path d="M21 12H9" />
      </>
    );
  }

  if (name === 'check') {
    return <path d="m5 13 4 4 10-10" />;
  }

  if (name === 'x') {
    return (
      <>
        <path d="m6 6 12 12" />
        <path d="m18 6-12 12" />
      </>
    );
  }

  if (name === 'help') {
    return (
      <>
        <path d="M9.5 9a2.5 2.5 0 1 1 4.2 1.8c-.8.7-1.7 1.1-1.7 2.2" />
        <path d="M12 17h.01" />
        <circle cx="12" cy="12" r="9" />
      </>
    );
  }

  if (name === 'open') {
    return (
      <>
        <path d="M14 3h7v7" />
        <path d="m10 14 11-11" />
        <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
      </>
    );
  }

  return null;
}

export function UiIcon({ name, size = 16, className }: UiIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconShape(name)}
    </svg>
  );
}
