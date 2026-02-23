import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActivityCard } from '../../components/activities/ActivityCard';
import type { Activity } from '../../types/activity';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const makeActivity = (overrides: Partial<Activity> = {}): Activity => ({
  activityId: 'act-1',
  hostUserId: 'host-1',
  hostNickname: 'HostUser',
  title: 'Morning Jog',
  description: 'A pleasant morning jog in the park',
  category: 'sports',
  location: { latitude: 35.6, longitude: 139.7, address: 'Shinjuku, Tokyo' },
  dateTime: '2026-03-01T09:00:00Z',
  duration: 90,
  maxParticipants: 10,
  currentParticipants: 3,
  participants: ['host-1', 'user-2', 'user-3'],
  status: 'upcoming',
  tags: ['running', 'morning', 'health'],
  createdAt: '2026-02-20T00:00:00Z',
  updatedAt: '2026-02-20T00:00:00Z',
  ...overrides,
});

describe('ActivityCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render activity title', () => {
    render(<ActivityCard activity={makeActivity()} />);
    expect(screen.getByText('Morning Jog')).toBeTruthy();
  });

  it('should render activity description', () => {
    render(<ActivityCard activity={makeActivity()} />);
    expect(screen.getByText('A pleasant morning jog in the park')).toBeTruthy();
  });

  it('should render category badge', () => {
    render(<ActivityCard activity={makeActivity({ category: 'sports' })} />);
    expect(screen.getByText('スポーツ')).toBeTruthy();
  });

  it('should render host nickname', () => {
    render(<ActivityCard activity={makeActivity()} />);
    expect(screen.getByText(/HostUser/)).toBeTruthy();
  });

  it('should render participant count', () => {
    render(<ActivityCard activity={makeActivity({ currentParticipants: 3, maxParticipants: 10 })} />);
    expect(screen.getByText('3/10人')).toBeTruthy();
  });

  it('should render location address', () => {
    render(<ActivityCard activity={makeActivity()} />);
    expect(screen.getByText('Shinjuku, Tokyo')).toBeTruthy();
  });

  it('should show "満員" badge when full', () => {
    render(
      <ActivityCard
        activity={makeActivity({ currentParticipants: 10, maxParticipants: 10 })}
      />
    );
    expect(screen.getByText('満員')).toBeTruthy();
  });

  it('should not show "満員" badge when not full', () => {
    render(
      <ActivityCard
        activity={makeActivity({ currentParticipants: 3, maxParticipants: 10 })}
      />
    );
    expect(screen.queryByText('満員')).toBeNull();
  });

  it('should show "キャンセル" badge when status is cancelled', () => {
    render(<ActivityCard activity={makeActivity({ status: 'cancelled' })} />);
    expect(screen.getByText('キャンセル')).toBeTruthy();
  });

  it('should show recurrence label when set', () => {
    render(<ActivityCard activity={makeActivity({ recurrence: 'weekly' })} />);
    expect(screen.getByText('毎週開催')).toBeTruthy();
  });

  it('should not show recurrence label for "none"', () => {
    render(<ActivityCard activity={makeActivity({ recurrence: 'none' })} />);
    expect(screen.queryByText('毎週開催')).toBeNull();
    expect(screen.queryByText('なし')).toBeNull();
  });

  it('should render tags (max 3)', () => {
    render(
      <ActivityCard
        activity={makeActivity({ tags: ['tag1', 'tag2', 'tag3', 'tag4'] })}
      />
    );
    expect(screen.getByText('tag1')).toBeTruthy();
    expect(screen.getByText('tag2')).toBeTruthy();
    expect(screen.getByText('tag3')).toBeTruthy();
    expect(screen.queryByText('tag4')).toBeNull();
  });

  it('should not render tags section when tags are empty', () => {
    const { container } = render(
      <ActivityCard activity={makeActivity({ tags: [] })} />
    );
    // No tag spans should be present
    const tagSpans = container.querySelectorAll('.flex.flex-wrap.gap-2.mt-3 span');
    expect(tagSpans).toHaveLength(0);
  });

  it('should render image when imageUrl is provided', () => {
    const { container } = render(
      <ActivityCard activity={makeActivity({ imageUrl: 'https://example.com/img.jpg' })} />
    );
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toBe('https://example.com/img.jpg');
    expect(img?.getAttribute('alt')).toBe('Morning Jog');
  });

  it('should render placeholder icon when no imageUrl', () => {
    const { container } = render(
      <ActivityCard activity={makeActivity({ imageUrl: undefined })} />
    );
    const img = container.querySelector('img');
    expect(img).toBeNull();
  });

  it('should navigate to activity detail on click', () => {
    const { container } = render(<ActivityCard activity={makeActivity()} />);
    // The root div handles click
    const card = container.firstElementChild;
    if (card) {
      fireEvent.click(card);
    }
    expect(mockNavigate).toHaveBeenCalledWith('/activities/act-1');
  });

  it('should format duration as hours and minutes', () => {
    render(<ActivityCard activity={makeActivity({ duration: 90 })} />);
    expect(screen.getByText(/1時間30分/)).toBeTruthy();
  });

  it('should format duration as hours only when no remainder', () => {
    render(<ActivityCard activity={makeActivity({ duration: 120 })} />);
    expect(screen.getByText(/2時間/)).toBeTruthy();
  });

  it('should format duration as minutes only when under 1 hour', () => {
    render(<ActivityCard activity={makeActivity({ duration: 45 })} />);
    expect(screen.getByText(/45分/)).toBeTruthy();
  });

  it('should show default location text when address is missing', () => {
    render(
      <ActivityCard
        activity={makeActivity({
          location: { latitude: 0, longitude: 0, address: '' },
        })}
      />
    );
    // The component uses activity.location?.address || '場所未設定'
    // Empty string is falsy, so it should show '場所未設定'
    expect(screen.getByText('場所未設定')).toBeTruthy();
  });
});
