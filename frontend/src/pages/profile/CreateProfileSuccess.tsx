import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Icon } from '../../components/ui/Icon';

/**
 * Profile creation success page
 */
export const CreateProfileSuccess = () => {
  const navigate = useNavigate();

  return (
    <Layout isAuthenticated={true}>
      <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark px-4">
        <div className="max-w-md w-full bg-white dark:bg-surface-dark rounded-xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon name="check_circle" size="xl" className="text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            プロフィール作成完了！
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            おめでとうございます！プロフィールが作成されました。
            <br />
            さっそく近くの仲間を探してみましょう。
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
              className="w-full px-6 py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition font-semibold"
            >
              アクティビティを探す
            </button>
          </div>

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3 text-left">
              <Icon name="lightbulb" className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-semibold mb-1">次のステップ</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                  <li>近くのアクティビティをチェック</li>
                  <li>興味のあるユーザーをフォロー</li>
                  <li>メッセージで交流を始める</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
