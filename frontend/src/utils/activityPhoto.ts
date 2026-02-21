const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY as string | undefined;

// カテゴリ→検索クエリのマッピング（日本の40代向け）
const CATEGORY_QUERIES: Record<string, string> = {
  sports: 'adults playing sports outdoors friends',
  outdoor: 'adults hiking camping outdoor nature',
  hobby: 'adults hobby crafts art photography',
  food: 'japanese restaurant food friends dining',
  culture: 'japanese temple museum culture adults',
  business: 'professionals meeting networking coworking',
  other: 'adults community gathering friends activity',
};

interface UnsplashSearchResponse {
  results: { urls: { regular: string } }[];
}

// sessionStorageキャッシュを使って同カテゴリの重複リクエストを防ぐ
export async function fetchActivityPhoto(category: string): Promise<string | null> {
  if (!UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY === 'your_unsplash_access_key_here') {
    return null;
  }

  const cacheKey = `activity_photo_${category}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached !== null) {
    return cached || null; // 空文字はフェッチ失敗キャッシュ
  }

  const query = CATEGORY_QUERIES[category] ?? CATEGORY_QUERIES.other;

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`
    );
    if (!res.ok) {
      sessionStorage.setItem(cacheKey, '');
      return null;
    }
    const data: UnsplashSearchResponse = await res.json();
    // ランダムに1枚選択（毎回同じにならないよう）
    const photos = data.results;
    if (photos.length === 0) {
      sessionStorage.setItem(cacheKey, '');
      return null;
    }
    const photo = photos[Math.floor(Math.random() * photos.length)];
    const url = photo.urls.regular;
    sessionStorage.setItem(cacheKey, url);
    return url;
  } catch {
    sessionStorage.setItem(cacheKey, '');
    return null;
  }
}
