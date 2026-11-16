import { useId } from 'react'

// Same brand mark as nafaqati-web.
export default function Logo({ size = 34 }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" role="img" aria-label="Nafaqati logo">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1e6bff" />
          <stop offset="1" stopColor="#7b3ff2" />
        </linearGradient>
      </defs>
      <rect width="72" height="72" rx="20" fill={`url(#${id})`} />
      <path d="M22 52V20h6l16 21V20h6v32h-6L28 31v21z" fill="#fff" />
    </svg>
  )
}
