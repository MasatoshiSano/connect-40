import { Link } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Icon } from '../../components/ui/Icon';

export const VerificationSuccess = () => (
  <Layout isAuthenticated={true}>
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <Icon name="hourglass_empty" className="!text-[64px] text-gold mx-auto mb-6 block" />
        <h1 className="font-serif text-3xl font-light tracking-ryokan text-text-primary dark:text-text-dark-primary mb-4">
          ありがとうございます
        </h1>
        <p className="text-text-secondary dark:text-text-dark-secondary mb-2">
          書類を受け付けました。
        </p>
        <p className="text-text-secondary dark:text-text-dark-secondary mb-10">
          通常2〜3営業日で審査が完了します。
        </p>
        <Link
          to="/dashboard"
          className="inline-block px-8 py-3 border border-gold text-gold hover:bg-gold/10 transition font-light tracking-ryokan"
        >
          ダッシュボードへ
        </Link>
      </div>
    </div>
  </Layout>
);
