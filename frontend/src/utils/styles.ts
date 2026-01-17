/**
 * Shared style utilities for consistent UI theming
 */

export type LevelType = 'low' | 'medium' | 'high'

/**
 * Color classes for low/medium/high level indicators
 * Used for risk levels, complexity badges, etc.
 */
export const LEVEL_COLORS: Record<LevelType, string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
}
