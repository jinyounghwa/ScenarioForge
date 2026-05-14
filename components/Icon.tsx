// Remix Icon wrapper — https://remixicon.com/
// Usage: <Icon name="ri-dashboard-line" />

interface Props {
  name: string
  className?: string
  size?: number | string
}

export default function Icon({ name, className = '', size }: Props) {
  return (
    <i
      className={`${name} ${className}`}
      style={size ? { fontSize: size } : undefined}
    />
  )
}
