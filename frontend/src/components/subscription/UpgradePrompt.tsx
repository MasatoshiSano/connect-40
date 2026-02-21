import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui/Icon';

interface UpgradePromptProps {
  onClose: () => void;
  message?: string;
}

export const UpgradePrompt = ({ onClose, message }: UpgradePromptProps) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-modal bg-black/70 flex items-center justify-center p-4">
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark max-w-md w-full p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gold/10 flex items-center justify-center mx-auto mb-4">
            <Icon name="workspace_premium" size="xl" className="text-gold" />
          </div>

          <h2 className="text-xl font-serif font-light tracking-ryokan text-text-primary dark:text-text-dark-primary mb-3">
            無料プランの上限に達しました
          </h2>

          <p className="text-sm text-text-secondary dark:text-text-secondary dark:text-text-dark-secondary mb-6">
            {message || 'プレミアムプランにアップグレードすると、すべての機能を無制限にご利用いただけます。'}
          </p>

          <div className="bg-elevated-light dark:bg-elevated-dark border border-border-light dark:border-border-dark p-4 mb-6 text-left">
            <h3 className="text-sm text-gold mb-3 font-light">プレミアムプランの特典</h3>
            <ul className="space-y-2">
              {[
                'アクティビティ参加 無制限',
                'チャットルーム 無制限',
                '写真アップロード 無制限',
                'プレミアムバッジ表示',
                '高度な検索フィルター',
              ].map((benefit) => (
                <li key={benefit} className="flex items-center gap-2 text-sm text-text-secondary dark:text-text-dark-secondary">
                  <Icon name="check" size="sm" className="text-gold" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-muted hover:text-gold transition-colors duration-base font-light"
            >
              閉じる
            </button>
            <button
              onClick={() => {
                onClose();
                navigate('/subscription/plans');
              }}
              className="flex-1 py-3 bg-gold text-base hover:bg-gold/90 transition-all duration-base font-light"
            >
              プランを見る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
