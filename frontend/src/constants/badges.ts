export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
  perk: string;
}

export const BADGES: BadgeDefinition[] = [
  {
    id: 'first_join',
    name: '初参加',
    description: '初めてアクティビティに参加',
    icon: 'emoji_events',
    condition: 'activities_joined >= 1',
    perk: '「初参加者」ラベルがプロフィールに表示されます',
  },
  {
    id: 'regular',
    name: '常連',
    description: '5回以上参加',
    icon: 'workspace_premium',
    condition: 'activities_joined >= 5',
    perk: '「常連メンバー」として仲間に認識されます',
  },
  {
    id: 'first_host',
    name: '初主催',
    description: '初めてアクティビティを主催',
    icon: 'stars',
    condition: 'activities_hosted >= 1',
    perk: '主催アクティビティが上位に表示されます',
  },
  {
    id: 'popular_host',
    name: '人気ホスト',
    description: '主催イベントに計20人以上参加',
    icon: 'trending_up',
    condition: 'total_participants >= 20',
    perk: '仲間を探す一覧で「人気ホスト」として強調表示されます',
  },
  {
    id: 'reviewer',
    name: 'レビュアー',
    description: '初めてレビューを投稿',
    icon: 'rate_review',
    condition: 'reviews_written >= 1',
    perk: '口コミが信頼性マーク付きで表示されます',
  },
  {
    id: 'social',
    name: 'ソーシャル',
    description: '3つ以上のチャットに参加',
    icon: 'forum',
    condition: 'chat_rooms >= 3',
    perk: '「アクティブメンバー」としてコミュニティで認知されます',
  },
  {
    id: 'veteran',
    name: 'ベテラン',
    description: '登録から30日経過',
    icon: 'military_tech',
    condition: 'days_since_registration >= 30',
    perk: '「ベテランメンバー」としてプロフィールにゴールドボーダーが付きます',
  },
];

export interface UserStats {
  activitiesJoined: number;
  activitiesHosted: number;
  totalParticipants: number;
  reviewsWritten: number;
  chatRooms: number;
  daysSinceRegistration: number;
}

export const evaluateBadge = (badge: BadgeDefinition, stats: UserStats): boolean => {
  const conditionMap: Record<string, number> = {
    activities_joined: stats.activitiesJoined,
    activities_hosted: stats.activitiesHosted,
    total_participants: stats.totalParticipants,
    reviews_written: stats.reviewsWritten,
    chat_rooms: stats.chatRooms,
    days_since_registration: stats.daysSinceRegistration,
  };

  const match = badge.condition.match(/^(\w+)\s*>=\s*(\d+)$/);
  if (!match) return false;

  const [, key, threshold] = match;
  const value = conditionMap[key];
  if (value === undefined) return false;

  return value >= Number(threshold);
};

export const getEarnedBadges = (stats: UserStats): BadgeDefinition[] => {
  return BADGES.filter((badge) => evaluateBadge(badge, stats));
};
