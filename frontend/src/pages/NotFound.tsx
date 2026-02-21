import { Icon } from '../components/ui/Icon';

export const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-50 dark:bg-base px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-8xl font-serif font-light text-gold/20 mb-4">
            404
          </h1>
          <h2 className="text-2xl font-serif font-light tracking-ryokan text-text-primary dark:text-text-dark-primary mb-4">
            ページが見つかりません
          </h2>
          <p className="text-text-secondary dark:text-text-dark-secondary font-light mb-8">
            お探しのページは存在しないか、移動した可能性があります。
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gold text-gold hover:bg-gold/10 transition duration-base font-light"
          >
            <Icon name="home" />
            ホームに戻る
          </a>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-secondary hover:border-gold/40 hover:text-gold transition duration-base font-light"
          >
            <Icon name="arrow_back" />
            前のページに戻る
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-border-light dark:border-border-dark">
          <p className="text-sm text-text-secondary dark:text-text-dark-muted font-light">
            お困りの場合は
            <a
              href="/contact"
              className="ml-1 text-gold hover:text-gold/80 font-light"
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
