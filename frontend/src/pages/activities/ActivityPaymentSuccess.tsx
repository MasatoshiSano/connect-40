import { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Icon } from '../../components/ui/Icon';

export const ActivityPaymentSuccess = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  // session_id が存在しない場合はアクティビティ一覧へリダイレクト
  useEffect(() => {
    if (!sessionId) {
      navigate(activityId ? `/activities/${activityId}` : '/activities', { replace: true });
    }
  }, [sessionId, navigate, activityId]);

  if (!sessionId) return null;

  return (
    <Layout isAuthenticated={true}>
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center py-12">
        <div className="max-w-md mx-auto text-center px-8">
          <div className="w-20 h-20 bg-gold/10 flex items-center justify-center mx-auto mb-8">
            <Icon name="check_circle" size="xl" className="text-gold" />
          </div>

          <p className="text-xs tracking-ryokan-wide text-gold uppercase mb-3">PAYMENT COMPLETE</p>
          <h1 className="text-2xl font-serif font-light tracking-ryokan text-text-primary dark:text-text-dark-primary mb-4">
            お支払いが完了しました
          </h1>
          <p className="text-text-secondary dark:text-text-dark-secondary mb-2">
            参加登録が完了しました。
          </p>
          <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-10">
            アクティビティへの参加をお楽しみください。
          </p>

          <div className="flex flex-col gap-3">
            {activityId && (
              <button
                onClick={() => navigate(`/activities/${activityId}`)}
                className="px-8 py-3 border border-gold text-gold hover:bg-gold/10 transition-all duration-base ease-elegant font-light flex items-center justify-center gap-2"
              >
                <Icon name="arrow_back" size="sm" />
                アクティビティに戻る
              </button>
            )}
            <button
              onClick={() => navigate('/chat')}
              className="px-8 py-3 border border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-secondary hover:border-gold/40 transition-all duration-base ease-elegant font-light flex items-center justify-center gap-2"
            >
              <Icon name="chat_bubble" size="sm" />
              グループチャットを開く
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};
