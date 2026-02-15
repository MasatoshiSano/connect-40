import { useState } from 'react';
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

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') return;

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
    <Layout isAuthenticated={true}>
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                プランを選択
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                あなたに最適なプランを選んでください
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`
                    bg-white dark:bg-surface-dark rounded-2xl shadow-lg p-8
                    ${plan.recommended ? 'ring-4 ring-primary relative' : ''}
                  `}
                >
                  {plan.recommended && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 bg-primary text-white text-sm font-semibold rounded-full">
                        おすすめ
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      {plan.name}
                    </h2>
                    <div className="mb-2">
                      <span className="text-5xl font-bold text-gray-900 dark:text-white">
                        ¥{plan.price.toLocaleString()}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">/月</span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Icon name="check_circle" className="text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                    {plan.limitations?.map((limitation, index) => (
                      <li key={`limit-${index}`} className="flex items-start gap-3">
                        <Icon name="cancel" className="text-red-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-500 dark:text-gray-400">{limitation}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isProcessing || plan.id === 'free'}
                    className={`
                      w-full py-4 rounded-lg font-semibold transition
                      ${plan.recommended
                        ? 'bg-primary text-white hover:bg-primary-600'
                        : 'border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
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
              <div className="mt-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Icon name="error" className="text-red-600 dark:text-red-400" />
                  <p className="text-red-900 dark:text-red-100">{error}</p>
                </div>
              </div>
            )}

            <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <div className="flex items-start gap-3">
                <Icon name="info" className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-semibold mb-2">お支払いについて</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
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
