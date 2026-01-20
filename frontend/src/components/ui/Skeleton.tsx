import { clsx } from 'clsx'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

const VARIANT_CLASSES = {
  text: 'rounded',
  circular: 'rounded-full',
  rectangular: 'rounded-lg',
} as const

const ANIMATION_CLASSES = {
  pulse: 'animate-pulse',
  wave: 'skeleton-wave',
  none: '',
} as const

function formatDimension(value: string | number): string {
  return typeof value === 'number' ? `${value}px` : value
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps): JSX.Element {
  const style: React.CSSProperties = {
    ...(width && { width: formatDimension(width) }),
    ...(height && { height: formatDimension(height) }),
  }

  return (
    <div
      className={clsx(
        'bg-gray-200',
        VARIANT_CLASSES[variant],
        ANIMATION_CLASSES[animation],
        className
      )}
      style={style}
    />
  )
}
