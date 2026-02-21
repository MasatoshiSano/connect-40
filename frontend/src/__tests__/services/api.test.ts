import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Store the mock state so we can change it between tests
let mockIdToken: string | null = 'mock-id-token';

vi.mock('../../stores/auth', () => ({
  useAuthStore: {
    getState: () => ({
      idToken: mockIdToken,
    }),
  },
}));

// Dynamic import so mocks are in place
async function loadApi() {
  // Clear module cache to pick up latest mock values
  vi.resetModules();

  // Re-apply the mock after resetModules
  vi.doMock('../../stores/auth', () => ({
    useAuthStore: {
      getState: () => ({
        idToken: mockIdToken,
      }),
    },
  }));

  return import('../../services/api');
}

describe('API Service - fetchWithAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIdToken = 'mock-id-token';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should include Authorization header with idToken', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { userId: '123', nickname: 'test' } }),
    });

    const { getUserProfile } = await loadApi();
    await getUserProfile();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/users/me'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-id-token',
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('should throw "Not authenticated" when idToken is null', async () => {
    mockIdToken = null;

    const { getUserProfile } = await loadApi();
    await expect(getUserProfile()).rejects.toThrow('Not authenticated');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should parse error response when request fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input' },
      }),
    });

    const { getUserProfile } = await loadApi();
    await expect(getUserProfile()).rejects.toThrow('Invalid input');
  });

  it('should handle non-JSON error response gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new Error('not json');
      },
    });

    const { getUserProfile } = await loadApi();
    await expect(getUserProfile()).rejects.toThrow('An unknown error occurred');
  });

  it('should unwrap data from response envelope', async () => {
    const profileData = {
      userId: 'u1',
      email: 'test@example.com',
      nickname: 'Tester',
      age: 35,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: profileData }),
    });

    const { getUserProfile } = await loadApi();
    const result = await getUserProfile();
    expect(result).toEqual(profileData);
  });
});

describe('API Service - createActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIdToken = 'mock-id-token';
  });

  it('should POST with JSON body', async () => {
    const activityInput = {
      title: 'Morning Run',
      description: 'A casual jog',
      category: 'sports' as const,
      location: { latitude: 35.6, longitude: 139.7, address: 'Tokyo' },
      dateTime: '2026-03-01T09:00:00Z',
      duration: 60,
      maxParticipants: 5,
      tags: ['running'],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { activityId: 'a1', ...activityInput } }),
    });

    const { createActivity } = await loadApi();
    await createActivity(activityInput);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/activities'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(activityInput),
      })
    );
  });
});

describe('API Service - getActivities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIdToken = 'mock-id-token';
  });

  it('should append query params when provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { activities: [], count: 0 } }),
    });

    const { getActivities } = await loadApi();
    await getActivities({ category: 'sports', limit: 10 });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('category=sports');
    expect(calledUrl).toContain('limit=10');
  });

  it('should not append query params when none provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { activities: [], count: 0 } }),
    });

    const { getActivities } = await loadApi();
    await getActivities();

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toMatch(/\/activities$/);
  });
});

describe('API Service - joinActivity / leaveActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIdToken = 'mock-id-token';
  });

  it('should POST to join endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { message: 'Joined', chatRoomId: 'cr1' } }),
    });

    const { joinActivity } = await loadApi();
    const result = await joinActivity('act-123');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/activities/act-123/join'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(result).toEqual({ message: 'Joined', chatRoomId: 'cr1' });
  });

  it('should POST to leave endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { message: 'Left' } }),
    });

    const { leaveActivity } = await loadApi();
    const result = await leaveActivity('act-123');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/activities/act-123/leave'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(result).toEqual({ message: 'Left' });
  });
});
