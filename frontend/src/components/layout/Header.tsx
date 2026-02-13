import { Icon } from '../ui/Icon';
import { useDarkMode } from '../../hooks/useDarkMode';

interface HeaderProps {
  isAuthenticated?: boolean;
}

export const Header = ({ isAuthenticated = false }: HeaderProps) => {
  const { isDark, toggle } = useDarkMode();

  return (
    <header className="sticky top-0 z-sticky bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Icon name="diversity_3" className="text-white" size="lg" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Connect40
            </h1>
          </div>

          {/* Navigation */}
          {isAuthenticated ? (
            <nav className="hidden md:flex items-center gap-6">
              <a href="/" className="text-gray-700 dark:text-gray-300 hover:text-primary transition">
                ホーム
              </a>
              <a href="/activities" className="text-gray-700 dark:text-gray-300 hover:text-primary transition">
                アクティビティ
              </a>
              <a href="/chat" className="text-gray-700 dark:text-gray-300 hover:text-primary transition">
                チャット
              </a>
              <a href="/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-primary transition">
                ダッシュボード
              </a>
            </nav>
          ) : (
            <nav className="hidden md:flex items-center gap-6">
              <a href="/" className="text-gray-700 dark:text-gray-300 hover:text-primary transition">
                ホーム
              </a>
              <a href="/about" className="text-gray-700 dark:text-gray-300 hover:text-primary transition">
                コンセプト
              </a>
              <a href="/activities" className="text-gray-700 dark:text-gray-300 hover:text-primary transition">
                アクティビティ
              </a>
              <a href="/pricing" className="text-gray-700 dark:text-gray-300 hover:text-primary transition">
                料金プラン
              </a>
            </nav>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggle}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="ダークモード切替"
            >
              <Icon name={isDark ? 'light_mode' : 'dark_mode'} />
            </button>

            {isAuthenticated ? (
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <Icon name="account_circle" size="lg" />
              </button>
            ) : (
              <a
                href="/login"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition"
              >
                ログイン
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
