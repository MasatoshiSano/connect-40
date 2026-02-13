import { Layout } from '../components/layout/Layout';
import { Icon } from '../components/ui/Icon';

/**
 * Home/Landing page for unauthenticated visitors
 */
export const Home = () => {
  return (
    <Layout isAuthenticated={false}>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              第3の居場所を見つける
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Connect40は40代男性向けの孤独解消マッチングプラットフォームです
            </p>
            <div className="flex justify-center gap-4">
              <a
                href="/signup"
                className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition font-semibold"
              >
                無料で始める
              </a>
              <a
                href="/about"
                className="px-8 py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition font-semibold"
              >
                詳しく見る
              </a>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="p-6 bg-white dark:bg-surface-dark rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Icon name="location_on" size="lg" className="text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
                地域密着
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                近所で気軽に会える仲間を見つけられます
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-surface-dark rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Icon name="groups" size="lg" className="text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
                同世代の安心感
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                35-49歳男性限定のコミュニティ
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-surface-dark rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Icon name="verified_user" size="lg" className="text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
                本人確認済み
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                安全・安心なマッチング体験
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
