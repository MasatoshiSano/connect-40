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
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center py-12">
        <div className="max-w-md w-full mx-auto px-4">
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="check_circle" size="xl" className="text-green-600 dark:text-green-400" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              登録完了！
            </h1>

            <p className="text-gray-600 dark:text-gray-400 mb-8">
              プレミアムプランへの登録が完了しました。
              <br />
              これからConnect40をフルに活用して、素敵な仲間を見つけましょう！
            </p>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition font-semibold"
              >
                ダッシュボードへ
              </button>

              <button
                onClick={() => navigate('/activities')}
                className="w-full px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold"
              >
                アクティビティを探す
              </button>
            </div>

            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              登録内容の確認やプランの変更は、プロフィール設定から行えます。
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};
