import { Icon } from '../components/ui/Icon';

export const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <Icon
            name="error_outline"
            size="xl"
            className="text-gray-400 dark:text-gray-600 mx-auto mb-4"
            style={{ fontSize: '6rem' }}
          />
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-2">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
            ページが見つかりません
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            お探しのページは存在しないか、移動した可能性があります。
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition font-semibold"
          >
            <Icon name="home" />
            ホームに戻る
          </a>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-semibold"
          >
            <Icon name="arrow_back" />
            前のページに戻る
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            お困りの場合は
            <a
              href="/contact"
              className="ml-1 text-primary hover:underline font-semibold"
            >
              お問い合わせ
            </a>
            ください。
          </p>
        </div>
      </div>
    </div>
  );
};
