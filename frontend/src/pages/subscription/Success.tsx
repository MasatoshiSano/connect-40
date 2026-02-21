import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Icon } from '../../components/ui/Icon';

export const Success = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      navigate('/subscription/plans');
    }
  }, [sessionId, navigate]);

  return (
    <Layout isAuthenticated={true}>
      <div className="min-h-screen bg-base-50 dark:bg-base flex items-center justify-center py-12">
        <div className="max-w-md w-full mx-auto px-4">
          <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-8 text-center">
            <div className="w-20 h-20 bg-gold/10 flex items-center justify-center mx-auto mb-6">
              <Icon name="check_circle" size="xl" className="text-gold" />
            </div>

            <h1 className="text-3xl font-serif font-light tracking-ryokan text-text-primary dark:text-text-dark-primary mb-4">
              登録完了！
            </h1>

            <p className="text-text-secondary dark:text-text-dark-secondary font-light mb-8">
              プレミアムプランへの登録が完了しました。
              <br />
              これからConnect40をフルに活用して、素敵な仲間を見つけましょう！
            </p>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full px-6 py-3 border border-gold text-gold hover:bg-gold/10 transition duration-base font-light"
              >
                ダッシュボードへ
              </button>

              <button
                onClick={() => navigate('/activities')}
                className="w-full px-6 py-3 border border-border-dark text-text-secondary dark:text-text-dark-secondary hover:border-gold/40 hover:text-gold transition duration-base font-light"
              >
                アクティビティを探す
              </button>
            </div>

            <p className="mt-6 text-sm text-text-secondary dark:text-text-dark-muted font-light">
              登録内容の確認やプランの変更は、プロフィール設定から行えます。
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};
