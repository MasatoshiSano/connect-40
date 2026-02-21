import { useNavigate } from 'react-router-dom';

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  return (
    <footer className="bg-base-100 dark:bg-base text-text-secondary dark:text-text-dark-muted">
      <div className="max-w-ryokan mx-auto px-4 py-20">
        {/* Logo */}
        <div className="text-center mb-12">
          <h3 className="font-serif text-gold tracking-ryokan-brand text-lg">Connect40</h3>
          <p className="text-sm mt-3 text-text-secondary dark:text-text-dark-muted">40代のための、第3の居場所</p>
        </div>

        {/* Links - horizontal */}
        <nav className="flex flex-wrap justify-center gap-8 text-sm mb-12">
          <button onClick={() => navigate('/about')} className="text-text-secondary dark:text-text-dark-muted hover:text-gold transition-all duration-base">コンセプト</button>
          <button onClick={() => navigate('/activities')} className="text-text-secondary dark:text-text-dark-muted hover:text-gold transition-all duration-base">アクティビティ</button>
          <button onClick={() => navigate('/pricing')} className="text-text-secondary dark:text-text-dark-muted hover:text-gold transition-all duration-base">料金プラン</button>
          <button onClick={() => navigate('/terms')} className="text-text-secondary dark:text-text-dark-muted hover:text-gold transition-all duration-base">利用規約</button>
          <button onClick={() => navigate('/privacy')} className="text-text-secondary dark:text-text-dark-muted hover:text-gold transition-all duration-base">プライバシーポリシー</button>
        </nav>

        {/* Divider + Copyright */}
        <div className="border-t border-border-light dark:border-border-dark pt-8 text-center text-xs text-text-secondary dark:text-text-dark-muted">
          <p>&copy; {currentYear} Connect40. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
