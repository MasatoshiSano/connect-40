import type { ActivityCategory } from '../types/activity';

export interface CategoryInfo {
  id: ActivityCategory;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export const ACTIVITY_CATEGORIES: CategoryInfo[] = [
  {
    id: 'sports',
    name: 'スポーツ',
    icon: 'sports_soccer',
    description: 'サッカー、テニス、ゴルフ、ランニングなど',
    color: 'bg-blue-500',
  },
  {
    id: 'outdoor',
    name: 'アウトドア',
    icon: 'hiking',
    description: 'キャンプ、BBQ、釣り、ハイキングなど',
    color: 'bg-green-500',
  },
  {
    id: 'hobby',
    name: '趣味',
    icon: 'palette',
    description: '写真、音楽、ゲーム、映画鑑賞など',
    color: 'bg-purple-500',
  },
  {
    id: 'food',
    name: 'グルメ',
    icon: 'restaurant',
    description: 'カフェ巡り、居酒屋、料理、ワインなど',
    color: 'bg-orange-500',
  },
  {
    id: 'culture',
    name: '文化',
    icon: 'museum',
    description: '美術館、博物館、旅行、街歩きなど',
    color: 'bg-pink-500',
  },
  {
    id: 'business',
    name: 'ビジネス',
    icon: 'business_center',
    description: '起業、投資、プログラミング、勉強会など',
    color: 'bg-indigo-500',
  },
  {
    id: 'other',
    name: 'その他',
    icon: 'more_horiz',
    description: 'その他のアクティビティ',
    color: 'bg-gray-500',
  },
];

export const DURATION_OPTIONS = [
  { value: 60, label: '1時間' },
  { value: 90, label: '1.5時間' },
  { value: 120, label: '2時間' },
  { value: 180, label: '3時間' },
  { value: 240, label: '4時間' },
  { value: 480, label: '半日（4-8時間）' },
  { value: 720, label: '終日（8時間以上）' },
];

export const MAX_PARTICIPANTS_OPTIONS = [
  { value: 2, label: '2人' },
  { value: 3, label: '3人' },
  { value: 4, label: '4人' },
  { value: 5, label: '5人' },
  { value: 6, label: '6人' },
  { value: 8, label: '8人' },
  { value: 10, label: '10人' },
  { value: 15, label: '15人' },
  { value: 20, label: '20人' },
];

export const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'なし' },
  { value: 'weekly', label: '毎週' },
  { value: 'biweekly', label: '隔週' },
  { value: 'monthly', label: '毎月' },
] as const;

export const RECURRENCE_LABELS: Record<string, string> = {
  none: 'なし',
  weekly: '毎週開催',
  biweekly: '隔週開催',
  monthly: '毎月開催',
};
