import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { NotificationBell } from '../notifications/NotificationBell';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useAuthStore } from '../../stores/auth';

interface HeaderProps {
  isAuthenticated?: boolean;
}

export const Header = ({ isAuthenticated = false }: HeaderProps) => {
  const { isDark, toggle } = useDarkMode();
  const navigate = useNavigate();
  const { clearAuth, nickname } = useAuthStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Scroll-based transparency (passive listener for performance)
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isUserMenuOpen || isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen, isMobileMenuOpen]);

  const handleLogout = () => {
    clearAuth();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  return (
    <header className={`sticky top-0 z-sticky transition-all duration-slow ${isScrolled ? 'bg-base/90 backdrop-blur-md border-b border-border-dark' : 'bg-transparent border-b border-transparent'}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-[80px]">
          {/* Logo */}
          <button onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')} className="focus:outline-none">
            <h1 className="font-serif text-xl tracking-ryokan-brand text-gold">
              Connect40
            </h1>
          </button>

          {/* Navigation */}
          {isAuthenticated ? (
            <nav className="hidden md:flex items-center gap-6">
              <button onClick={() => navigate('/')} className="text-text-dark-muted hover:text-gold transition-colors duration-base">
                ホーム
              </button>
              <button onClick={() => navigate('/activities')} className="text-text-dark-muted hover:text-gold transition-colors duration-base">
                アクティビティ
              </button>
              <button onClick={() => navigate('/chat')} className="text-text-dark-muted hover:text-gold transition-colors duration-base">
                チャット
              </button>
              <button onClick={() => navigate('/discover')} className="text-text-dark-muted hover:text-gold transition-colors duration-base">
                仲間を探す
              </button>
              <button onClick={() => navigate('/calendar')} className="text-text-dark-muted hover:text-gold transition-colors duration-base">
                カレンダー
              </button>
              <button onClick={() => navigate('/dashboard')} className="text-text-dark-muted hover:text-gold transition-colors duration-base">
                ダッシュボード
              </button>
              {nickname && (
                <span className="text-text-dark-muted text-sm">
                  {nickname}さん
                </span>
              )}
            </nav>
          ) : (
            <nav className="hidden md:flex items-center gap-6">
              <button onClick={() => navigate('/')} className="text-text-dark-muted hover:text-gold transition-colors duration-base">
                ホーム
              </button>
              <button onClick={() => navigate('/about')} className="text-text-dark-muted hover:text-gold transition-colors duration-base">
                コンセプト
              </button>
              <button onClick={() => navigate('/activities')} className="text-text-dark-muted hover:text-gold transition-colors duration-base">
                アクティビティ
              </button>
              <button onClick={() => navigate('/subscription/plans')} className="text-text-dark-muted hover:text-gold transition-colors duration-base">
                料金プラン
              </button>
            </nav>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-text-dark-muted hover:text-gold transition-colors duration-base"
              aria-label="メニュー"
            >
              <Icon name={isMobileMenuOpen ? 'close' : 'menu'} />
            </button>

            <button
              onClick={toggle}
              className="p-2 text-text-dark-muted hover:text-gold transition-colors duration-base"
              aria-label="ダークモード切替"
            >
              <Icon name={isDark ? 'light_mode' : 'dark_mode'} />
            </button>

            {isAuthenticated && <NotificationBell />}

            {isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="p-2 text-text-dark-muted hover:text-gold transition-colors duration-base"
                  aria-label="ユーザーメニュー"
                >
                  <Icon name="account_circle" size="lg" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-elevated-dark shadow-lg border border-border-dark py-2 z-50">
                    <button
                      onClick={() => {
                        navigate('/profile/edit');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-text-dark-muted hover:text-gold hover:bg-gold/5 transition-colors duration-base flex items-center gap-2"
                    >
                      <Icon name="person" size="sm" />
                      プロフィール編集
                    </button>
                    <button
                      onClick={() => {
                        navigate('/dashboard');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-text-dark-muted hover:text-gold hover:bg-gold/5 transition-colors duration-base flex items-center gap-2"
                    >
                      <Icon name="dashboard" size="sm" />
                      ダッシュボード
                    </button>
                    <hr className="my-2 border-border-dark" />
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-text-dark-muted hover:text-gold hover:bg-gold/5 transition-colors duration-base flex items-center gap-2"
                    >
                      <Icon name="logout" size="sm" />
                      ログアウト
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="border border-gold text-gold hover:bg-gold/10 px-5 py-2 transition-all duration-base"
              >
                ログイン
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div
          ref={mobileMenuRef}
          className={`md:hidden border-t border-border-dark bg-base transition-all duration-base overflow-hidden ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 border-t-0'}`}
        >
          <nav className="container mx-auto px-4 py-4">
            {isAuthenticated ? (
              <div className="flex flex-col space-y-3">
                {nickname && (
                  <div className="px-4 py-2 text-sm text-text-dark-muted border-b border-border-dark">
                    {nickname}さん
                  </div>
                )}
                <button
                  onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}
                  className="px-4 py-3 text-left text-text-dark-muted hover:text-gold hover:bg-gold/5 transition-colors duration-base"
                >
                  ホーム
                </button>
                <button
                  onClick={() => { navigate('/activities'); setIsMobileMenuOpen(false); }}
                  className="px-4 py-3 text-left text-text-dark-muted hover:text-gold hover:bg-gold/5 transition-colors duration-base"
                >
                  アクティビティ
                </button>
                <button
                  onClick={() => { navigate('/chat'); setIsMobileMenuOpen(false); }}
                  className="px-4 py-3 text-left text-text-dark-muted hover:text-gold hover:bg-gold/5 transition-colors duration-base"
                >
                  チャット
                </button>
                <button
                  onClick={() => { navigate('/discover'); setIsMobileMenuOpen(false); }}
                  className="px-4 py-3 text-left text-text-dark-muted hover:text-gold hover:bg-gold/5 transition-colors duration-base"
                >
                  仲間を探す
                </button>
                <button
                  onClick={() => { navigate('/calendar'); setIsMobileMenuOpen(false); }}
                  className="px-4 py-3 text-left text-text-dark-muted hover:text-gold hover:bg-gold/5 transition-colors duration-base"
                >
                  カレンダー
                </button>
                <button
                  onClick={() => { navigate('/dashboard'); setIsMobileMenuOpen(false); }}
                  className="px-4 py-3 text-left text-text-dark-muted hover:text-gold hover:bg-gold/5 transition-colors duration-base"
                >
                  ダッシュボード
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}
                  className="px-4 py-3 text-left text-text-dark-muted hover:text-gold hover:bg-gold/5 transition-colors duration-base"
                >
                  ホーム
                </button>
                <button
                  onClick={() => { navigate('/about'); setIsMobileMenuOpen(false); }}
                  className="px-4 py-3 text-left text-text-dark-muted hover:text-gold hover:bg-gold/5 transition-colors duration-base"
                >
                  コンセプト
                </button>
                <button
                  onClick={() => { navigate('/activities'); setIsMobileMenuOpen(false); }}
                  className="px-4 py-3 text-left text-text-dark-muted hover:text-gold hover:bg-gold/5 transition-colors duration-base"
                >
                  アクティビティ
                </button>
                <button
                  onClick={() => { navigate('/subscription/plans'); setIsMobileMenuOpen(false); }}
                  className="px-4 py-3 text-left text-text-dark-muted hover:text-gold hover:bg-gold/5 transition-colors duration-base"
                >
                  料金プラン
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
