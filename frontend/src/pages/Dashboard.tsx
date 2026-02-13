import { Layout } from '../components/layout/Layout';
import { Icon } from '../components/ui/Icon';

/**
 * Dashboard page - placeholder for authenticated users
 * TODO: Implement actual dashboard features in later phases
 */
export const Dashboard = () => {
  return (
    <Layout isAuthenticated={true}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              ダッシュボード
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              ようこそ、Connect40へ！
            </p>
          </div>

          {/* Placeholder content */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name="person" size="lg" className="text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    プロフィール
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    プロフィールを作成して、マッチングを始めましょう
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name="event" size="lg" className="text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    アクティビティ
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    近くのイベントやアクティビティを探す
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name="chat" size="lg" className="text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    チャット
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    マッチした仲間とチャットする
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
