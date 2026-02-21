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
      <div className="min-h-screen flex items-center justify-center bg-base-50 dark:bg-base px-4">
        <div className="max-w-md w-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-8 text-center">
          <div className="w-20 h-20 bg-gold/10 flex items-center justify-center mx-auto mb-6">
            <Icon name="check_circle" size="xl" className="text-gold" />
          </div>
          <h2 className="text-3xl font-serif font-light tracking-ryokan mb-4 text-text-primary dark:text-text-dark-primary">
            プロフィール作成完了！
          </h2>
          <p className="text-text-secondary dark:text-text-dark-secondary font-light mb-8">
            おめでとうございます！プロフィールが作成されました。
            <br />
            さっそく近くの仲間を探してみましょう。
          </p>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full px-6 py-3 border border-gold text-gold hover:bg-gold/10 transition duration-base font-light"
            >
              ダッシュボードへ
            </button>
            <button
              onClick={() => navigate('/activities')}
              className="w-full px-6 py-3 border border-border-dark text-text-secondary dark:text-text-dark-secondary hover:border-gold/40 hover:text-gold transition duration-base font-light"
            >
              アクティビティを探す
            </button>
          </div>

          <div className="mt-8 p-4 bg-gold/5 border border-gold/20">
            <div className="flex items-start gap-3 text-left">
              <Icon name="lightbulb" className="text-gold flex-shrink-0" />
              <div className="text-sm text-text-secondary dark:text-text-dark-secondary font-light">
                <p className="font-light mb-1 text-text-primary dark:text-text-dark-primary">次のステップ</p>
                <ul className="list-disc list-inside space-y-1">
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
