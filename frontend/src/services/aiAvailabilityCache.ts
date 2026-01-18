/**
 * Shared AI Availability Cache
 * Centralized caching for AI service availability status
 */

import { aiApi } from '@/api'

let aiAvailable: boolean | null = null

/**
 * Check if AI service is available via backend
 * Returns cached value if available, otherwise fetches from API
 */
export async function checkAIAvailability(): Promise<boolean> {
  if (aiAvailable !== null) {
    return aiAvailable
  }

  try {
    const status = await aiApi.getStatus()
    aiAvailable = status.available
    return aiAvailable
  } catch (error) {
    console.warn('Failed to check AI status:', error)
    aiAvailable = false
    return false
  }
}

/**
 * Get cached AI availability status synchronously
 * Returns false if cache is empty
 */
export function getAIAvailabilitySync(): boolean {
  return aiAvailable ?? false
}

/**
 * Reset AI availability cache
 * Call this after login/logout to refresh the status
 */
export function resetAIAvailabilityCache(): void {
  aiAvailable = null
}

/**
 * Check if user is authenticated
 */
export function isUserAuthenticated(): boolean {
  return localStorage.getItem('access_token') !== null
}

/**
 * Check if AI is available for authenticated users
 * Returns false immediately if not authenticated
 */
export async function isAIAvailableForUser(): Promise<boolean> {
  if (!isUserAuthenticated()) {
    return false
  }
  return checkAIAvailability()
}

/**
 * Synchronous check for AI availability (uses cached value)
 * Returns false if not authenticated or cache is empty
 */
export function isAIAvailableForUserSync(): boolean {
  if (!isUserAuthenticated()) {
    return false
  }
  return getAIAvailabilitySync()
}
