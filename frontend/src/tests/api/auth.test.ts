import { describe, it, expect, beforeEach, vi } from 'vitest'
import axios from 'axios'
import { authApi } from '@/api/auth'

vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockResponse = {
        data: {
          id: 1,
          email: 'test@example.com',
          full_name: 'Test User',
          is_premium: false,
        },
      }

      mockedAxios.post.mockResolvedValueOnce(mockResponse)

      const result = await authApi.register({
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
      })

      expect(result).toEqual(mockResponse.data)
      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/register', {
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
      })
    })

    it('should throw error on registration failure', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Email already exists'))

      await expect(
        authApi.register({
          email: 'test@example.com',
          password: 'password123',
          full_name: 'Test User',
        })
      ).rejects.toThrow('Email already exists')
    })
  })

  describe('login', () => {
    it('should login successfully and store tokens', async () => {
      const mockResponse = {
        data: {
          access_token: 'access_token_123',
          refresh_token: 'refresh_token_456',
          token_type: 'bearer',
        },
      }

      mockedAxios.post.mockResolvedValueOnce(mockResponse)

      const result = await authApi.login({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result).toEqual(mockResponse.data)
      expect(localStorage.getItem('access_token')).toBe('access_token_123')
      expect(localStorage.getItem('refresh_token')).toBe('refresh_token_456')
    })

    it('should throw error on login failure', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Invalid credentials'))

      await expect(
        authApi.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid credentials')

      expect(localStorage.getItem('access_token')).toBeNull()
      expect(localStorage.getItem('refresh_token')).toBeNull()
    })
  })

  describe('logout', () => {
    it('should clear tokens from localStorage', async () => {
      localStorage.setItem('access_token', 'token123')
      localStorage.setItem('refresh_token', 'refresh123')

      mockedAxios.post.mockResolvedValueOnce({ data: {} })

      await authApi.logout()

      expect(localStorage.getItem('access_token')).toBeNull()
      expect(localStorage.getItem('refresh_token')).toBeNull()
    })

    it('should clear tokens even if API call fails', async () => {
      localStorage.setItem('access_token', 'token123')
      localStorage.setItem('refresh_token', 'refresh123')

      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'))

      await authApi.logout()

      expect(localStorage.getItem('access_token')).toBeNull()
      expect(localStorage.getItem('refresh_token')).toBeNull()
    })
  })

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      const mockResponse = {
        data: {
          access_token: 'new_access_token',
          refresh_token: 'new_refresh_token',
          token_type: 'bearer',
        },
      }

      mockedAxios.post.mockResolvedValueOnce(mockResponse)

      const result = await authApi.refresh('old_refresh_token')

      expect(result).toEqual(mockResponse.data)
      expect(localStorage.getItem('access_token')).toBe('new_access_token')
      expect(localStorage.getItem('refresh_token')).toBe('new_refresh_token')
    })
  })

  describe('isAuthenticated', () => {
    it('should return true when access token exists', () => {
      localStorage.setItem('access_token', 'token123')

      expect(authApi.isAuthenticated()).toBe(true)
    })

    it('should return false when access token does not exist', () => {
      expect(authApi.isAuthenticated()).toBe(false)
    })
  })

  describe('getAccessToken', () => {
    it('should return access token from localStorage', () => {
      localStorage.setItem('access_token', 'token123')

      expect(authApi.getAccessToken()).toBe('token123')
    })

    it('should return null when no token exists', () => {
      expect(authApi.getAccessToken()).toBeNull()
    })
  })

  describe('getRefreshToken', () => {
    it('should return refresh token from localStorage', () => {
      localStorage.setItem('refresh_token', 'refresh123')

      expect(authApi.getRefreshToken()).toBe('refresh123')
    })

    it('should return null when no token exists', () => {
      expect(authApi.getRefreshToken()).toBeNull()
    })
  })
})
