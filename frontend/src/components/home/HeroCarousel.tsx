import { useState, useEffect, useCallback, useRef } from 'react';
import { Icon } from '../ui/Icon';

const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY as
  | string
  | undefined;
const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY as
  | string
  | undefined;

interface VideoSlide {
  type: 'video';
  videoUrl: string;
  posterUrl: string;
  title: string;
  subtitle: string;
  duration: number;
}

interface ImageSlide {
  type: 'image';
  imageUrl: string;
  kenBurns: 'a' | 'b' | 'c';
  title: string;
  subtitle: string;
  duration: number;
  photographer?: string;
  photographerUrl?: string;
}

type Slide = VideoSlide | ImageSlide;

interface PexelsVideoFile {
  link: string;
  quality: string;
  file_type: string;
  width: number;
}

interface PexelsVideo {
  video_files: PexelsVideoFile[];
  image: string;
}

interface PexelsVideoResponse {
  videos: PexelsVideo[];
}

interface UnsplashPhoto {
  urls: { regular: string };
  user: { name: string; links: { html: string } };
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
}

const VIDEO_QUERIES = [
  'japanese mountain nature ambient',
  'sake japanese bar evening',
  'tokyo lifestyle adult',
];

const IMAGE_QUERIES = [
  'japan outdoor mountain hiking',
  'japanese sake culture',
  'golf japan green',
  'japanese restaurant dinner',
];

const SLIDE_CONTENT = [
  { title: '第3の居場所を、見つける', subtitle: '40代、新しい仲間と出会う場所' },
  { title: '同世代と、気負わない繋がり', subtitle: '趣味を通じて生まれる、本物の友情' },
  { title: '地域で、豊かな時間を', subtitle: '近所だから気軽に、深い繋がりを' },
  { title: '本物の体験を、仲間とともに', subtitle: '大人だからこそ楽しめる、上質な時間' },
  { title: '人生を、もっと豊かに', subtitle: '新しい出会いが、新しい自分を見つける' },
];

const KEN_BURNS = ['a', 'b', 'c'] as const;

const FALLBACK_GRADIENTS = [
  'from-base-900 via-base-800 to-base',
  'from-[#1a1510] via-base-800 to-[#0d0b09]',
  'from-[#0f1510] via-base to-[#101510]',
  'from-[#15100a] via-base-800 to-[#0a0f15]',
  'from-base via-[#1a1510] to-base-900',
];

const VIDEO_DURATION = 8000;
const IMAGE_DURATION = 6000;

const KEN_BURNS_CLASS: Record<'a' | 'b' | 'c', string> = {
  a: 'animate-ken-burns-a',
  b: 'animate-ken-burns-b',
  c: 'animate-ken-burns-c',
};

async function fetchPexelsVideo(): Promise<{
  videoUrl: string;
  posterUrl: string;
} | null> {
  if (!PEXELS_API_KEY) return null;
  for (const query of VIDEO_QUERIES) {
    try {
      const res = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`,
        { headers: { Authorization: PEXELS_API_KEY } },
      );
      if (!res.ok) continue;
      const data: PexelsVideoResponse = await res.json();
      const video = data.videos[0];
      if (!video) continue;
      const file =
        video.video_files.find(
          (f) => f.quality === 'hd' && f.file_type === 'video/mp4',
        ) ?? video.video_files.find((f) => f.file_type === 'video/mp4');
      if (!file) continue;
      return { videoUrl: file.link, posterUrl: video.image };
    } catch {
      continue;
    }
  }
  return null;
}

async function fetchUnsplashImages(): Promise<
  { imageUrl: string; photographer?: string; photographerUrl?: string }[]
> {
  if (
    !UNSPLASH_ACCESS_KEY ||
    UNSPLASH_ACCESS_KEY === 'your_unsplash_access_key_here'
  ) {
    return IMAGE_QUERIES.map(() => ({ imageUrl: '' }));
  }
  return Promise.all(
    IMAGE_QUERIES.map(async (query) => {
      try {
        const res = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`,
        );
        if (!res.ok) return { imageUrl: '' };
        const data: UnsplashSearchResponse = await res.json();
        const photo = data.results[0];
        if (!photo) return { imageUrl: '' };
        return {
          imageUrl: photo.urls.regular,
          photographer: photo.user.name,
          photographerUrl: photo.user.links.html,
        };
      } catch {
        return { imageUrl: '' };
      }
    }),
  );
}

function buildSlides(
  pexels: { videoUrl: string; posterUrl: string } | null,
  images: { imageUrl: string; photographer?: string; photographerUrl?: string }[],
): Slide[] {
  const slides: Slide[] = [];

  if (pexels) {
    slides.push({
      type: 'video',
      videoUrl: pexels.videoUrl,
      posterUrl: pexels.posterUrl,
      title: SLIDE_CONTENT[0].title,
      subtitle: SLIDE_CONTENT[0].subtitle,
      duration: VIDEO_DURATION,
    });
  } else {
    slides.push({
      type: 'image',
      imageUrl: '',
      kenBurns: 'c',
      title: SLIDE_CONTENT[0].title,
      subtitle: SLIDE_CONTENT[0].subtitle,
      duration: IMAGE_DURATION,
    });
  }

  images.forEach((img, i) => {
    slides.push({
      type: 'image',
      imageUrl: img.imageUrl,
      kenBurns: KEN_BURNS[(i + 1) % KEN_BURNS.length],
      title: SLIDE_CONTENT[i + 1].title,
      subtitle: SLIDE_CONTENT[i + 1].subtitle,
      duration: IMAGE_DURATION,
      photographer: img.photographer,
      photographerUrl: img.photographerUrl,
    });
  });

  return slides;
}

export const HeroCarousel = () => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.all([fetchPexelsVideo(), fetchUnsplashImages()])
      .then(([pexels, images]) => {
        setSlides(buildSlides(pexels, images));
      })
      .finally(() => setIsLoading(false));
  }, []);

  const goToSlide = useCallback(
    (index: number) => {
      if (slides.length === 0) return;
      setCurrentIndex((index + slides.length) % slides.length);
    },
    [slides.length],
  );

  const goNext = useCallback(
    () => goToSlide(currentIndex + 1),
    [currentIndex, goToSlide],
  );
  const goPrev = useCallback(
    () => goToSlide(currentIndex - 1),
    [currentIndex, goToSlide],
  );

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const duration = slides[currentIndex]?.duration ?? IMAGE_DURATION;
    timerRef.current = setTimeout(goNext, duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, isPaused, goNext, slides]);

  if (isLoading) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-base">
        <div className="text-gold/40 animate-pulse">
          <Icon name="photo_camera" className="!text-[48px]" />
        </div>
      </section>
    );
  }

  if (slides.length === 0) return null;

  const currentSlide = slides[currentIndex];

  return (
    <section
      className="group relative min-h-screen overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 背景レイヤー */}
      {slides.map((slide, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 overflow-hidden transition-opacity duration-luxe ease-luxe ${
            idx === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden={idx !== currentIndex}
        >
          {slide.type === 'video' ? (
            <video
              src={slide.videoUrl}
              poster={slide.posterUrl}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : slide.imageUrl ? (
            <img
              src={slide.imageUrl}
              alt=""
              className={`absolute inset-0 w-full h-full object-cover ${
                idx === currentIndex ? KEN_BURNS_CLASS[slide.kenBurns] : ''
              }`}
              loading={idx === 0 ? 'eager' : 'lazy'}
            />
          ) : (
            <div
              className={`absolute inset-0 bg-gradient-to-br ${
                FALLBACK_GRADIENTS[idx % FALLBACK_GRADIENTS.length]
              }`}
            />
          )}
          {/* ダークオーバーレイ */}
          <div className="absolute inset-0 bg-black/45" />
        </div>
      ))}

      {/* テキストコンテンツ */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-4">
        {/* key でアンマウント→リマウントしてアニメーションをリセット */}
        <div key={currentIndex}>
          <h2 className="font-serif font-light text-5xl md:text-6xl lg:text-7xl text-white tracking-ryokan leading-tight animate-stagger-title">
            {currentSlide.title}
          </h2>
          <p className="text-lg md:text-xl text-white/75 tracking-wide max-w-xl mx-auto mt-6 animate-stagger-sub">
            {currentSlide.subtitle}
          </p>
          <div className="flex justify-center gap-4 mt-12 animate-stagger-cta">
            <a
              href="/signup"
              className="px-8 py-3 border border-gold text-gold hover:bg-gold/10 transition-all duration-base ease-elegant tracking-wide"
            >
              無料で始める
            </a>
            <a
              href="#concept"
              className="px-8 py-3 border border-white/30 text-white hover:border-white/60 transition-all duration-base ease-elegant tracking-wide"
            >
              詳しく見る
            </a>
          </div>
        </div>

        {/* フォトクレジット */}
        {currentSlide.type === 'image' && currentSlide.photographer && (
          <div className="absolute bottom-16 right-4 text-xs text-white/30">
            Photo by{' '}
            <a
              href={`${currentSlide.photographerUrl}?utm_source=connect40&utm_medium=referral`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white/50 transition-colors"
            >
              {currentSlide.photographer}
            </a>{' '}
            on Unsplash
          </div>
        )}

        {/* スクロールヒント */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-white/30">
          <Icon name="keyboard_arrow_down" size="xl" />
        </div>
      </div>

      {/* ナビゲーション */}
      {slides.length > 1 && (
        <>
          {/* 左矢印（ホバーで表示） */}
          <button
            onClick={goPrev}
            className="absolute left-5 top-1/2 -translate-y-1/2 z-20 p-3 text-white/0 group-hover:text-white/30 hover:!text-white/80 transition-all duration-slow ease-luxe"
            aria-label="前のスライド"
          >
            <Icon name="arrow_back_ios" className="!text-[26px]" />
          </button>

          {/* 右矢印（ホバーで表示） */}
          <button
            onClick={goNext}
            className="absolute right-5 top-1/2 -translate-y-1/2 z-20 p-3 text-white/0 group-hover:text-white/30 hover:!text-white/80 transition-all duration-slow ease-luxe"
            aria-label="次のスライド"
          >
            <Icon name="arrow_forward_ios" className="!text-[26px]" />
          </button>

          {/* プログレスバーナビゲーション（ドット廃止） */}
          <div className="absolute bottom-0 left-0 right-0 z-20 flex">
            {slides.map((slide, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className="flex-1 h-6 flex items-end cursor-pointer"
                aria-label={`スライド ${idx + 1} へ移動`}
              >
                <span className="block w-full h-[2px] bg-white/20 overflow-hidden relative">
                  {idx === currentIndex && (
                    <span
                      key={currentIndex}
                      className="absolute inset-0 bg-gold"
                      style={{
                        transformOrigin: 'left',
                        animation: `progressFill ${slide.duration}ms linear forwards`,
                        animationPlayState: isPaused ? 'paused' : 'running',
                      }}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
};
