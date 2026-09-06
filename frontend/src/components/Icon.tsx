type IconName = 'arrow' | 'bus' | 'calendar' | 'clock' | 'location' | 'seat' | 'sparkle' | 'ticket' | 'check' | 'chevron' | 'microphone'

export function Icon({ name, label }: { name: IconName; label?: string }) {
  const common = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': label ? undefined : true }
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    bus: <><path d="M5 17V6a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v11" /><path d="M5 12h14M7 17h10M8 21h.01M16 21h.01" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2" /></>,
    seat: <><path d="M6 11V6a2 2 0 0 1 4 0v5M6 11h11a1 1 0 0 1 1 1v4H5v-3a2 2 0 0 1 1-2ZM7 16v3M16 16v3" /></>,
    sparkle: <><path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z" /></>,
    ticket: <><path d="M4 5h16v5a2 2 0 0 0 0 4v5H4v-5a2 2 0 0 0 0-4V5Z" /><path d="M13 7v10" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    microphone: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M6 11a6 6 0 0 0 12 0M12 17v4M8 21h8" /></>,
  }
  return <svg {...common} role={label ? 'img' : undefined}><title>{label}</title>{paths[name]}</svg>
}
