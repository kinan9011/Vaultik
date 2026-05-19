import React, { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number; sw?: number };

const ico = (path: React.ReactNode, opts: { sw?: number } = {}) => (props: IconProps) => (
  <svg
    width={props.size || 16}
    height={props.size || 16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={opts.sw || 1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {path}
  </svg>
);

export const IconHome = ico(<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" /></>);
export const IconHistory = ico(<><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 7v5l3 2" /></>);
export const IconSettings = ico(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.55V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1.04H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1.04-1.55V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.16.4.6 1.04 1.55 1.04H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1.04Z" /></>);
export const IconCamera = ico(<><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" /><circle cx="12" cy="13" r="3.5" /></>);
export const IconFolder = ico(<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />);
export const IconPlay = ico(<path d="M6 4.5v15l13-7.5L6 4.5Z" />);
export const IconPause = ico(<><rect x="6" y="4.5" width="4" height="15" rx="1" /><rect x="14" y="4.5" width="4" height="15" rx="1" /></>);
export const IconStop = ico(<rect x="5" y="5" width="14" height="14" rx="2" />);
export const IconPlus = ico(<><path d="M12 5v14" /><path d="M5 12h14" /></>);
export const IconX = ico(<><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>);
export const IconCheck = ico(<path d="M5 12.5 10 17.5l9-11" />);
export const IconChevronRight = ico(<path d="m9 6 6 6-6 6" />);
export const IconChevronDown = ico(<path d="m6 9 6 6 6-6" />);
export const IconChevronLeft = ico(<path d="m15 6-6 6 6 6" />);
export const IconSearch = ico(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>);
export const IconFilter = ico(<path d="M3 5h18l-7 9v6l-4-2v-4L3 5Z" />);
export const IconDownload = ico(<><path d="M12 4v12" /><path d="m7 11 5 5 5-5" /><path d="M5 20h14" /></>);
export const IconUpload = ico(<><path d="M12 20V8" /><path d="m7 13 5-5 5 5" /><path d="M5 4h14" /></>);
export const IconShield = ico(<><path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></>);
export const IconKey = ico(<><circle cx="8" cy="15" r="4" /><path d="m10.8 12.2 9.2-9.2" /><path d="m17 6 3 3" /><path d="m14 9 3 3" /></>);
export const IconServer = ico(<><rect x="3" y="4" width="18" height="7" rx="2" /><rect x="3" y="13" width="18" height="7" rx="2" /><path d="M7 7.5h.01" /><path d="M7 16.5h.01" /></>);
export const IconCloud = ico(<path d="M17.5 19h-11A4.5 4.5 0 0 1 5.6 10.1a6 6 0 0 1 11.7 1.3 4 4 0 0 1 .2 7.6Z" />);
export const IconHdd = ico(<><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M7 12h.01" /><path d="M11 12h.01" /></>);
export const IconLock = ico(<><rect x="4.5" y="11" width="15" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>);
export const IconClock = ico(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
export const IconAlert = ico(<><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4" /><path d="M12 17.5h.01" /></>);
export const IconInfo = ico(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 7.5h.01" /></>);
export const IconFile = ico(<><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" /><path d="M14 3v6h6" /></>);
export const IconArrowRight = ico(<><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>);
export const IconArrowLeft = ico(<><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></>);
export const IconDots = ico(<><circle cx="5" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="19" cy="12" r="1.4" fill="currentColor" /></>);
export const IconRefresh = ico(<><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></>);
export const IconSun = ico(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.9 4.9 1.4 1.4" /><path d="m17.7 17.7 1.4 1.4" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m4.9 19.1 1.4-1.4" /><path d="m17.7 6.3 1.4-1.4" /></>);
export const IconMoon = ico(<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />);
export const IconBell = ico(<><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8Z" /><path d="M10.5 21a2 2 0 0 0 3 0" /></>);
export const IconTerminal = ico(<><path d="m7 10 3 2-3 2" /><path d="M13 14h4" /><rect x="3" y="5" width="18" height="14" rx="2" /></>);
export const IconDatabase = ico(<><ellipse cx="12" cy="5.5" rx="8" ry="2.5" /><path d="M4 5.5v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-6" /><path d="M4 11.5v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-6" /></>);
export const IconTrash = ico(<><path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M5 6v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6" /></>);
export const IconEye = ico(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>);
export const IconRestore = ico(<><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /><path d="M12 8v4l3 2" /></>);
export const IconLink = ico(<><path d="M10 14a5 5 0 0 1 0-7l3-3a5 5 0 0 1 7 7l-1.5 1.5" /><path d="M14 10a5 5 0 0 1 0 7l-3 3a5 5 0 0 1-7-7l1.5-1.5" /></>);

export const VaultikLogo = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="vg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f0c986" />
        <stop offset="1" stopColor="#c89248" />
      </linearGradient>
    </defs>
    <path
      d="M12 2.5 4 5v6.5c0 5 3.4 8.6 8 9.5 4.6-.9 8-4.5 8-9.5V5l-8-2.5Z"
      stroke="url(#vg)"
      strokeWidth="1.6"
      fill="rgba(232,185,106,0.08)"
    />
    <circle cx="12" cy="11" r="2" fill="url(#vg)" />
    <rect x="11.2" y="11.5" width="1.6" height="4" rx="0.4" fill="url(#vg)" />
  </svg>
);
