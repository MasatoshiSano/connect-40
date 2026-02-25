const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY as string | undefined;

const INTEREST_QUERIES: Record<string, string> = {
  // スポーツ
  'サッカー': 'soccer football match',
  '野球': 'baseball game',
  'バスケ': 'basketball game',
  'テニス': 'tennis court play',
  'ゴルフ': 'golf course green',
  'ランニング': 'running jogging park',
  'サイクリング': 'cycling bicycle road',
  '筋トレ': 'gym weight training',
  'ヨガ': 'yoga meditation practice',
  '水泳': 'swimming pool',
  '登山': 'mountain hiking trail',
  'ピラティス': 'pilates exercise studio',
  'ウォーキング': 'walking park nature',
  '卓球': 'table tennis ping pong',
  // アウトドア
  'キャンプ': 'camping tent outdoor',
  'BBQ': 'barbecue grill outdoor',
  '釣り': 'fishing river lake',
  'ハイキング': 'hiking nature trail',
  'サーフィン': 'surfing ocean wave',
  'スノーボード': 'snowboarding winter snow',
  'スキー': 'skiing snow mountain',
  '星空観察': 'stargazing night sky',
  '家庭菜園': 'home garden vegetable',
  // 趣味
  '写真': 'photography camera',
  '動画編集': 'video editing production',
  '読書': 'reading books library',
  '映画': 'cinema movie theater',
  'アニメ': 'anime illustration art',
  'ゲーム': 'video game controller',
  '音楽鑑賞': 'music concert headphones',
  '楽器演奏': 'musical instrument playing',
  'カラオケ': 'karaoke singing microphone',
  'DIY': 'diy woodworking craft',
  '園芸': 'gardening flowers plants',
  'ペット': 'pets dog cat',
  '書道': 'calligraphy brush ink',
  '陶芸': 'pottery ceramic art',
  '落語・演芸鑑賞': 'comedy stage performance',
  'ミニチュア・プラモデル': 'miniature model building hobby',
  // グルメ
  'カフェ巡り': 'cafe coffee shop',
  'ラーメン': 'ramen noodle japanese',
  '居酒屋': 'japanese izakaya bar',
  'ワイン': 'wine glass vineyard',
  'ビール': 'craft beer pub',
  '日本酒': 'sake japanese rice wine',
  'コーヒー': 'coffee beans latte',
  '料理': 'cooking kitchen food',
  'パン作り': 'bread baking bakery',
  'ウイスキー': 'whiskey glass bar',
  '食べ歩き': 'street food market',
  // 文化
  '美術館': 'art museum gallery',
  '博物館': 'museum exhibition',
  '神社仏閣': 'japanese shrine temple',
  '歴史': 'history ancient ruins',
  '旅行': 'travel adventure scenery',
  '温泉': 'hot spring onsen japan',
  '街歩き': 'city walking urban explore',
  '茶道・華道': 'tea ceremony flower arrangement',
  '古民家・建築巡り': 'traditional architecture building',
  '読書会・文学サークル': 'book club reading group',
  // ビジネス・学習
  '起業': 'startup entrepreneur business',
  '投資': 'investment finance stock',
  'プログラミング': 'programming coding computer',
  '英語': 'english language learning',
  '資格取得': 'certification study exam',
  'ビジネス書': 'business books reading',
  'ライフプランニング': 'life planning goals',
  '副業・フリーランス': 'freelance remote work',
  '健康管理・医療知識': 'health wellness medical',
  // その他
  '車': 'car automobile driving',
  'バイク': 'motorcycle ride',
  'ファッション': 'fashion style clothing',
  'アート': 'art painting creative',
  'ボランティア': 'volunteer community service',
  '語学': 'language learning study',
  '瞑想': 'meditation mindfulness calm',
  'ワークライフバランス': 'work life balance relaxation',
  '子育て・子供の教育': 'family children education',
  '親の介護・地域福祉': 'elderly care community welfare',
};

interface UnsplashPhoto {
  urls: { small: string; thumb: string };
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
}

export async function fetchInterestPhoto(interest: string): Promise<string | null> {
  if (!UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY === 'your_unsplash_access_key_here') {
    return null;
  }

  const cacheKey = `interest_photo_${interest}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached !== null) {
    return cached || null;
  }

  const query = INTEREST_QUERIES[interest] ?? interest;

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=3&orientation=squarish&client_id=${UNSPLASH_ACCESS_KEY}`
    );
    if (!res.ok) {
      localStorage.setItem(cacheKey, '');
      return null;
    }
    const data: UnsplashSearchResponse = await res.json();
    const photos = data.results;
    if (photos.length === 0) {
      localStorage.setItem(cacheKey, '');
      return null;
    }
    const photo = photos[Math.floor(Math.random() * photos.length)];
    const url = photo.urls.small;
    localStorage.setItem(cacheKey, url);
    return url;
  } catch {
    localStorage.setItem(cacheKey, '');
    return null;
  }
}

export async function fetchInterestPhotos(
  interests: string[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const uncached: string[] = [];

  for (const interest of interests) {
    const cached = localStorage.getItem(`interest_photo_${interest}`);
    if (cached) {
      result.set(interest, cached);
    } else if (cached === null) {
      uncached.push(interest);
    }
  }

  const BATCH_SIZE = 5;
  for (let i = 0; i < uncached.length; i += BATCH_SIZE) {
    const batch = uncached.slice(i, i + BATCH_SIZE);
    const photos = await Promise.all(batch.map(fetchInterestPhoto));
    batch.forEach((interest, idx) => {
      const url = photos[idx];
      if (url) result.set(interest, url);
    });
  }

  return result;
}
