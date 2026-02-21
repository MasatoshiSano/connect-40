import { useMemo } from 'react';
import { Icon } from '../ui/Icon';

interface ConversationStartersProps {
  onSelect: (message: string) => void;
}

interface TopicCategory {
  label: string;
  icon: string;
  topics: string[];
}

const TOPIC_CATEGORIES: TopicCategory[] = [
  {
    label: '趣味',
    icon: 'interests',
    topics: [
      '最近ハマっていることは？',
      'おすすめの映画/本は？',
      '休日の過ごし方は？',
    ],
  },
  {
    label: '仕事',
    icon: 'work',
    topics: [
      'どんなお仕事をされていますか？',
      '仕事で大切にしていることは？',
    ],
  },
  {
    label: '地域',
    icon: 'location_on',
    topics: [
      'この辺りでおすすめのお店は？',
      '地元のイベント情報ありますか？',
    ],
  },
  {
    label: '食事',
    icon: 'restaurant',
    topics: [
      '好きな料理のジャンルは？',
      '最近行った良いお店は？',
    ],
  },
  {
    label: 'スポーツ',
    icon: 'sports_soccer',
    topics: [
      '何かスポーツはされますか？',
      '応援しているチームは？',
    ],
  },
];

const getAllTopics = (): string[] => {
  return TOPIC_CATEGORIES.flatMap((cat) => cat.topics);
};

export const ConversationStarters = ({ onSelect }: ConversationStartersProps) => {
  const dailyTopic = useMemo(() => {
    const allTopics = getAllTopics();
    const today = new Date();
    const dayIndex =
      (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()) %
      allTopics.length;
    return allTopics[dayIndex];
  }, []);

  return (
    <div className="px-4 py-6">
      {/* Daily topic */}
      <div className="mb-6">
        <p className="text-xs text-text-secondary dark:text-text-dark-muted mb-2 font-light tracking-wide">
          今日の話題
        </p>
        <button
          onClick={() => onSelect(dailyTopic)}
          className="w-full text-left px-4 py-3 border border-gold/30 bg-gold/5 hover:bg-gold/10 transition-colors duration-base"
        >
          <div className="flex items-center gap-2">
            <Icon name="lightbulb" size="sm" className="text-gold" />
            <span className="text-sm text-gold font-light">{dailyTopic}</span>
          </div>
        </button>
      </div>

      {/* Topic categories */}
      <p className="text-xs text-text-secondary dark:text-text-dark-muted mb-3 font-light tracking-wide">
        会話のきっかけ
      </p>
      <div className="space-y-4">
        {TOPIC_CATEGORIES.map((category) => (
          <div key={category.label}>
            <div className="flex items-center gap-1.5 mb-2">
              <Icon name={category.icon} size="sm" className="text-text-secondary dark:text-text-dark-muted" />
              <span className="text-xs text-text-secondary dark:text-text-dark-muted font-light">
                {category.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {category.topics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => onSelect(topic)}
                  className="px-3 py-1.5 text-xs text-text-secondary dark:text-text-dark-secondary border border-border-light dark:border-border-dark hover:border-gold/50 hover:text-gold transition-colors duration-base font-light"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
