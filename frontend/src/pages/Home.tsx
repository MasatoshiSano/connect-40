import { Layout } from '../components/layout/Layout';
import { Icon } from '../components/ui/Icon';
import { HeroCarousel } from '../components/home/HeroCarousel';
import { useAuthStore } from '../stores/auth';

const features = [
  {
    icon: 'location_on',
    title: '地域密着',
    description: '近所で気軽に会える仲間が見つかります。同じ地域だからこそ生まれる安心感。',
  },
  {
    icon: 'groups',
    title: '同世代の安心感',
    description: '35-49歳の男性限定。世代が同じだから話も合う、自然体でいられるコミュニティ。',
  },
  {
    icon: 'verified_user',
    title: '本人確認済み',
    description: '全メンバーが本人確認済み。安全で信頼できる出会いを。',
  },
];

const steps = [
  {
    number: '01',
    title: 'プロフィール作成',
    description: '基本情報と興味を登録。\n本人確認で安心のコミュニティへ。',
  },
  {
    number: '02',
    title: 'アクティビティを探す',
    description: '地域のアクティビティを検索。\n気になるものに参加申込。',
  },
  {
    number: '03',
    title: '仲間と繋がる',
    description: 'チャットで交流を深め、\nリアルな繋がりを築く。',
  },
];

const stats = [
  { value: '1,200+', label: '会員数' },
  { value: '450+', label: 'アクティビティ' },
  { value: '4.8', label: '平均満足度' },
  { value: '92%', label: '継続率' },
];

const testimonials = [
  {
    quote: '同じ世代の仲間と登山を楽しめるようになりました。職場でも家族でもない、新しい繋がりが生まれました。',
    name: 'K.M.',
    age: 44,
    activity: '山岳トレッキング部',
  },
  {
    quote: '子どもが独立してから、趣味の仲間を探していました。Connect40で気の合う仲間に出会えました。',
    name: 'T.S.',
    age: 47,
    activity: 'クラフトビール探求',
  },
  {
    quote: '転職後に地域に知り合いがいなくて、Connect40を使い始めました。今では毎週ゴルフ仲間と会っています。',
    name: 'H.Y.',
    age: 41,
    activity: 'ゴルフサークル',
  },
];

/**
 * Home/Landing page - 星野リゾート界スタイルの静謐なランディングページ
 */
export const Home = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <Layout isAuthenticated={isAuthenticated}>
      {/* 1. ヒーローカルーセル */}
      <HeroCarousel />

      {/* 2. コンセプトセクション */}
      <section id="concept" className="py-28 md:py-36 bg-base-50 dark:bg-base">
        <div className="max-w-3xl mx-auto text-center px-4">
          <span className="section-label">CONCEPT</span>
          <h2 className="font-serif font-light text-3xl md:text-4xl tracking-ryokan mt-4 mb-8 text-text-primary dark:text-text-dark-primary">
            職場でも家庭でもない、あなたの居場所
          </h2>
          <div className="w-12 h-px bg-gold/30 mx-auto mb-10" />
          <p className="text-text-secondary dark:text-text-dark-secondary leading-loose max-w-2xl mx-auto text-lg font-light">
            40代。キャリアも家庭も安定する一方で、
            <br className="hidden md:block" />
            ふと気づく「自分だけの時間」の少なさ。
          </p>
          <p className="text-text-secondary dark:text-text-dark-secondary leading-loose max-w-2xl mx-auto mt-6 text-lg font-light">
            Connect40は、同世代の仲間と趣味やアクティビティを通じて、
            <br className="hidden md:block" />
            気負わない繋がりを見つけるためのコミュニティです。
          </p>
        </div>
      </section>

      {/* 3. 数字で見る信頼 */}
      <section className="py-20 md:py-24 bg-base-100 dark:bg-base-800 border-y border-border-light dark:border-border-dark">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-serif font-light text-4xl md:text-5xl text-gold tracking-wide">
                  {stat.value}
                </div>
                <div className="text-sm text-text-secondary dark:text-text-dark-muted mt-2 tracking-wide">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. 特徴セクション */}
      <section className="py-28 md:py-36 bg-surface-light dark:bg-surface-dark">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-20">
            <span className="section-label">FEATURES</span>
            <h2 className="font-serif font-light text-3xl md:text-4xl tracking-ryokan mt-4 text-text-primary dark:text-text-dark-primary">
              安心して繋がれる理由
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-0">
            {features.map((feature, idx) => (
              <div
                key={feature.icon}
                className={`text-center px-8 py-12 ${
                  idx < features.length - 1
                    ? 'md:border-r md:border-border-light dark:border-border-dark'
                    : ''
                }`}
              >
                <div className="w-16 h-16 mx-auto mb-8 border border-gold/30 flex items-center justify-center">
                  <Icon
                    name={feature.icon}
                    className="text-gold !text-[28px]"
                  />
                </div>
                <h3 className="font-serif font-light text-xl tracking-wide mb-4 text-text-primary dark:text-text-dark-primary">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. 利用の流れセクション */}
      <section className="py-28 md:py-36 bg-base-50 dark:bg-base">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-20">
            <span className="section-label">HOW IT WORKS</span>
            <h2 className="font-serif font-light text-3xl md:text-4xl tracking-ryokan mt-4 text-text-primary dark:text-text-dark-primary">
              はじめかた
            </h2>
          </div>
          <div className="flex flex-col md:flex-row gap-12 md:gap-0 items-start">
            {steps.map((step, idx) => (
              <div
                key={step.number}
                className={`flex-1 text-center px-6 ${
                  idx < steps.length - 1
                    ? 'md:border-r md:border-gold/20'
                    : ''
                }`}
              >
                <div className="text-6xl font-serif font-light text-gold/20 mb-4">
                  {step.number}
                </div>
                <h3 className="font-serif font-light text-lg tracking-wide mb-3 text-text-primary dark:text-text-dark-primary">
                  {step.title}
                </h3>
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary whitespace-pre-line leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. 会員の声セクション */}
      <section className="py-28 md:py-36 bg-base-100 dark:bg-base-800">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-20">
            <span className="section-label">VOICES</span>
            <h2 className="font-serif font-light text-3xl md:text-4xl tracking-ryokan mt-4 text-text-primary dark:text-text-dark-primary">
              会員の声
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="border border-border-light dark:border-border-dark p-8 md:p-10"
              >
                <Icon
                  name="format_quote"
                  className="text-gold/30 !text-[32px] mb-4 block"
                />
                <p className="text-text-secondary dark:text-text-dark-secondary leading-loose text-sm mb-8">
                  {testimonial.quote}
                </p>
                <div className="w-8 h-px bg-gold/30 mb-4" />
                <div className="text-text-primary dark:text-text-dark-primary font-serif text-sm tracking-wide">
                  {testimonial.name}
                </div>
                <div className="text-text-secondary dark:text-text-dark-muted text-xs mt-1">
                  {testimonial.age}歳 / {testimonial.activity}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CTAセクション */}
      <section className="py-28 md:py-36 bg-base relative overflow-hidden">
        {/* 背景の装飾 */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gold" />
          <div className="absolute top-0 right-1/4 w-px h-full bg-gold" />
        </div>

        <div className="relative text-center px-4">
          <div className="w-12 h-px bg-gold/30 mx-auto mb-12" />
          <h2 className="font-serif font-light text-3xl md:text-4xl lg:text-5xl tracking-ryokan text-text-primary dark:text-text-dark-primary mb-6">
            新しい一歩を、ここから
          </h2>
          <p className="text-text-secondary dark:text-text-dark-secondary mb-14 text-lg font-light">
            無料で始められます。あなたの居場所を見つけましょう。
          </p>
          <a
            href="/signup"
            className="inline-block px-12 py-4 border border-gold text-gold hover:bg-gold/10 transition-all duration-base ease-elegant tracking-ryokan text-lg"
          >
            無料で会員登録
          </a>
          <div className="w-12 h-px bg-gold/30 mx-auto mt-14" />
        </div>
      </section>
    </Layout>
  );
};
