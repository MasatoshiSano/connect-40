import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Icon } from '../../components/ui/Icon';
import { useAuthStore } from '../../stores/auth';
import { createCheckoutSession } from '../../services/payment';

const STRIPE_PREMIUM_PRICE_ID = import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID || '';

const PLANS = [
  {
    id: 'free',
    name: '無料プラン',
    price: 0,
    stripePriceId: '',
    features: [
      'アクティビティ参加: 月5回まで',
      'チャットルーム: 3件まで',
      'プロフィール写真: 1枚',
      '基本検索機能',
    ],
    limitations: [
      '詳細フィルター利用不可',
      'プレミアムバッジなし',
    ],
  },
  {
    id: 'premium',
    name: 'プレミアムプラン',
    price: 980,
    stripePriceId: STRIPE_PREMIUM_PRICE_ID,
    features: [
      'アクティビティ参加: 無制限',
      'チャットルーム: 無制限',
      'プロフィール写真: 5枚',
      '詳細検索フィルター',
      'プレミアムバッジ',
      '優先サポート',
    ],
    recommended: true,
  },
];

// Helper to decode JWT token and extract email
function getEmailFromToken(token: string | null): string | null {
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.email || null;
  } catch {
    return null;
  }
}

export const Plans = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { idToken } = useAuthStore();
  const navigate = useNavigate();
  const isAuthenticated = !!idToken;

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') return;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const plan = PLANS.find((p) => p.id === planId);
    if (!plan || !plan.stripePriceId) {
      setError('Stripe Price IDが設定されていません');
      return;
    }

    const email = getEmailFromToken(idToken);
    if (!email) {
      setError('メールアドレスが見つかりません');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const session = await createCheckoutSession({
        priceId: plan.stripePriceId,
        email,
      });

      // Redirect to Stripe Checkout
      window.location.href = session.url;
    } catch (err) {
      console.error('Subscription error:', err);
      setError(
        err instanceof Error ? err.message : 'サブスクリプションの作成に失敗しました'
      );
      setIsProcessing(false);
    }
  };

  return (
    <Layout isAuthenticated={isAuthenticated}>
      <div className="min-h-screen bg-base dark:bg-base py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl font-serif font-light tracking-ryokan text-text-primary dark:text-text-dark-primary mb-4">
                プランを選択
              </h1>
              <p className="text-xl text-text-secondary dark:text-text-dark-secondary font-light">
                あなたに最適なプランを選んでください
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`
                    bg-surface-light dark:bg-surface-dark border p-8
                    ${plan.recommended ? 'border-gold border-2 relative' : 'border-border-light dark:border-border-dark'}
                  `}
                >
                  {plan.recommended && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 bg-gold text-base text-sm font-light tracking-ryokan-wide uppercase">
                        おすすめ
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-serif font-light tracking-wide text-text-primary dark:text-text-dark-primary mb-4">
                      {plan.name}
                    </h2>
                    <div className="mb-2">
                      <span className="text-4xl font-serif font-light text-gold">
                        ¥{plan.price.toLocaleString()}
                      </span>
                      <span className="text-text-secondary dark:text-text-dark-secondary font-light">/月</span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Icon name="check_circle" className="text-gold flex-shrink-0 mt-0.5" />
                        <span className="text-text-secondary dark:text-text-dark-secondary font-light">{feature}</span>
                      </li>
                    ))}
                    {plan.limitations?.map((limitation, index) => (
                      <li key={`limit-${index}`} className="flex items-start gap-3">
                        <Icon name="cancel" className="text-text-dark-muted flex-shrink-0 mt-0.5" />
                        <span className="text-text-muted dark:text-text-dark-muted font-light">{limitation}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isProcessing || plan.id === 'free'}
                    className={`
                      w-full py-4 font-light transition duration-base
                      ${plan.recommended
                        ? 'border border-gold text-gold hover:bg-gold/10'
                        : 'border border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-secondary hover:border-gold/40'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    {plan.id === 'free' ? '現在のプラン' : isProcessing ? '処理中...' : '登録する'}
                  </button>
                </div>
              ))}
            </div>

            {error && (
              <div className="mt-8 p-4 bg-red-900/20 border border-red-800">
                <div className="flex items-center gap-2">
                  <Icon name="error" className="text-red-400" />
                  <p className="text-red-400 font-light">{error}</p>
                </div>
              </div>
            )}

            <div className="mt-12 p-6 bg-gold/5 border border-gold/20">
              <div className="flex items-start gap-3">
                <Icon name="info" className="text-gold flex-shrink-0" />
                <div className="text-sm text-text-dark-secondary font-light">
                  <p className="font-light mb-2 text-text-primary dark:text-text-dark-primary">お支払いについて</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>クレジットカード決済（Stripe）</li>
                    <li>初月無料トライアル実施中</li>
                    <li>いつでもキャンセル可能</li>
                    <li>日割り計算なし（月単位課金）</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
