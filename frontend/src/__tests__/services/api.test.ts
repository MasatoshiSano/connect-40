import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

// Mock auth store
vi.mock('../../stores/auth', () => ({
  useAuthStore: {
    getState: () => ({
      accessToken: 'mock-token',
    }),
  },
}));

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should include authorization header', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { userId: '123' } }),
    });

    const { getUserProfile } = await import('../../services/api');
    await getUserProfile();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/users/me'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-token',
        }),
      })
    );
  });

  it('should throw error when not authenticated', async () => {
    vi.mock('../../stores/auth', () => ({
      useAuthStore: {
        getState: () => ({
          accessToken: null,
        }),
      },
    }));

    const { getUserProfile } = await import('../../services/api');

    await expect(getUserProfile()).rejects.toThrow('Not authenticated');
  });
});
