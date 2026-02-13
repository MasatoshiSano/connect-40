export interface InterestCategory {
  id: string;
  name: string;
  interests: string[];
}

export const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    id: 'sports',
    name: 'スポーツ',
    interests: [
      'サッカー',
      '野球',
      'バスケ',
      'テニス',
      'ゴルフ',
      'ランニング',
      'サイクリング',
      '筋トレ',
      'ヨガ',
      '水泳',
      '登山',
    ],
  },
  {
    id: 'outdoor',
    name: 'アウトドア',
    interests: [
      'キャンプ',
      'BBQ',
      '釣り',
      'ハイキング',
      'サーフィン',
      'スノーボード',
      'スキー',
    ],
  },
  {
    id: 'hobby',
    name: '趣味',
    interests: [
      '写真',
      '動画編集',
      '読書',
      '映画',
      'アニメ',
      'ゲーム',
      '音楽鑑賞',
      '楽器演奏',
      'カラオケ',
      'DIY',
      '園芸',
      'ペット',
    ],
  },
  {
    id: 'food',
    name: 'グルメ',
    interests: [
      'カフェ巡り',
      'ラーメン',
      '居酒屋',
      'ワイン',
      'ビール',
      '日本酒',
      'コーヒー',
      '料理',
      'パン作り',
    ],
  },
  {
    id: 'culture',
    name: '文化',
    interests: [
      '美術館',
      '博物館',
      '神社仏閣',
      '歴史',
      '旅行',
      '温泉',
      '街歩き',
    ],
  },
  {
    id: 'business',
    name: 'ビジネス・学習',
    interests: [
      '起業',
      '投資',
      'プログラミング',
      '英語',
      '資格取得',
      'ビジネス書',
    ],
  },
  {
    id: 'other',
    name: 'その他',
    interests: [
      '車',
      'バイク',
      'ファッション',
      'アート',
      'ボランティア',
      '語学',
      '瞑想',
    ],
  },
];
