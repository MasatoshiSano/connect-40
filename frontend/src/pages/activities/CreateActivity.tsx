import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layout } from '../../components/layout/Layout';
import { Icon } from '../../components/ui/Icon';
import { ACTIVITY_CATEGORIES, DURATION_OPTIONS, MAX_PARTICIPANTS_OPTIONS, RECURRENCE_OPTIONS, ACTIVITY_TAGS, SITUATION_TAGS } from '../../constants/activities';
import { RefineButton } from '../../components/ui/RefineButton';
import type { Location } from '../../types/activity';

const MAX_TAGS = 10;

const createActivitySchema = z.object({
  title: z
    .string()
    .min(5, 'タイトルは5文字以上である必要があります')
    .max(100, 'タイトルは100文字以内である必要があります'),
  description: z
    .string()
    .min(20, '説明は20文字以上である必要があります')
    .max(1000, '説明は1000文字以内である必要があります'),
  category: z.enum(['sports', 'outdoor', 'hobby', 'food', 'culture', 'business', 'other']),
  dateTime: z.string().min(1, '日時を選択してください'),
  duration: z.number().min(30, '期間を選択してください'),
  maxParticipants: z.number().min(2, '最大参加者数を選択してください'),
  recurrence: z.enum(['none', 'weekly', 'biweekly', 'monthly']),
  entryFee: z
    .number()
    .min(0, '入場料は0以上の金額を入力してください')
    .max(100000, '入場料は100,000円以下にしてください')
    .int('入場料は整数で入力してください')
    .optional(),
});

type CreateActivityFormData = z.infer<typeof createActivitySchema>;

export const CreateActivity = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [addressInput, setAddressInput] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [activityImage, setActivityImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [isRecommendingCategory, setIsRecommendingCategory] = useState(false);
  const [tagGroups, setTagGroups] = useState<{
    situation: string[];
    suggested: string[];
    manual: string[];
  }>({ situation: [], suggested: [], manual: [] });
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  const [showMoreTags, setShowMoreTags] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateActivityFormData>({
    resolver: zodResolver(createActivitySchema),
    defaultValues: {
      duration: 120,
      maxParticipants: 5,
      recurrence: 'none',
    },
  });

  const descriptionLength = watch('description')?.length || 0;
  const currentTitle = watch('title');
  const currentDescription = watch('description');

  // Check if user has profile on mount
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const { getUserProfile } = await import('../../services/api');
        await getUserProfile();
        setHasProfile(true);
      } catch (err) {
        console.error('Profile check failed:', err);
        setHasProfile(false);
      } finally {
        setIsCheckingProfile(false);
      }
    };

    checkProfile();
  }, []);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('ファイルサイズは5MB以下にしてください');
      return;
    }

    setError(null);
    setActivityImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const geocodeAddress = async (address: string): Promise<{ latitude: number; longitude: number; address: string } | null> => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=jp`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Connect40App/1.0' },
      });
      if (!res.ok) return null;
      const data = await res.json() as Array<{ lat: string; lon: string; display_name: string }>;
      if (data.length === 0) return null;
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        address: data[0].display_name,
      };
    } catch {
      return null;
    }
  };

  const handleAddressSearch = async () => {
    if (!addressInput.trim()) return;
    setIsGeocoding(true);
    setGeocodeError(null);
    const result = await geocodeAddress(addressInput);
    if (result) {
      setLocation(result);
    } else {
      setGeocodeError('住所が見つかりませんでした。別の住所をお試しください。');
    }
    setIsGeocoding(false);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('お使いのブラウザは位置情報に対応していません');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        const locationData: Location = {
          latitude,
          longitude,
          address: `緯度: ${latitude.toFixed(4)}, 経度: ${longitude.toFixed(4)}`,
        };

        setLocation(locationData);
        setIsGettingLocation(false);
      },
      (geoError) => {
        console.error('Geolocation error:', geoError);
        setLocationError(
          geoError.code === 1
            ? '位置情報の利用が許可されていません'
            : '位置情報の取得に失敗しました'
        );
        setIsGettingLocation(false);
      }
    );
  };

  const handleRecommendCategory = async () => {
    if (!currentTitle || isRecommendingCategory) return;
    setIsRecommendingCategory(true);
    try {
      const { recommendCategory } = await import('../../services/api');
      const category = await recommendCategory(currentTitle, currentDescription);
      setValue('category', category as CreateActivityFormData['category']);
    } catch (err) {
      console.error('Category recommendation failed:', err);
    } finally {
      setIsRecommendingCategory(false);
    }
  };

  const totalTagCount = tagGroups.situation.length + tagGroups.suggested.length + tagGroups.manual.length;
  const canAddMore = totalTagCount < MAX_TAGS;

  const handleSituationTagToggle = (tag: string) => {
    setTagGroups(prev => {
      const total = prev.situation.length + prev.suggested.length + prev.manual.length;
      return {
        ...prev,
        situation: prev.situation.includes(tag)
          ? prev.situation.filter(t => t !== tag)
          : total < MAX_TAGS ? [...prev.situation, tag] : prev.situation,
      };
    });
  };

  const handleSuggestedTagToggle = (tag: string) => {
    setTagGroups(prev => {
      const total = prev.situation.length + prev.suggested.length + prev.manual.length;
      return {
        ...prev,
        suggested: prev.suggested.includes(tag)
          ? prev.suggested.filter(t => t !== tag)
          : total < MAX_TAGS ? [...prev.suggested, tag] : prev.suggested,
      };
    });
  };

  const handleManualTagToggle = (tag: string) => {
    setTagGroups(prev => {
      const total = prev.situation.length + prev.suggested.length + prev.manual.length;
      return {
        ...prev,
        manual: prev.manual.includes(tag)
          ? prev.manual.filter(t => t !== tag)
          : total < MAX_TAGS ? [...prev.manual, tag] : prev.manual,
      };
    });
  };

  const handleSuggestTags = async () => {
    const title = watch('title');
    const description = watch('description');
    const category = watch('category');
    if (!title && !description) return;
    setIsSuggestingTags(true);
    try {
      const { recommendTags } = await import('../../services/api');
      const tags = await recommendTags(title ?? '', description ?? '', category ?? '');
      setTagGroups(prev => ({ ...prev, suggested: tags }));
    } catch (error) {
      console.error('Tag suggestion failed:', error);
    } finally {
      setIsSuggestingTags(false);
    }
  };

  const onSubmit = async (data: CreateActivityFormData) => {
    if (!location) {
      setError('集合場所を設定してください');
      return;
    }

    // Validate future date
    const activityDate = new Date(data.dateTime);
    if (activityDate <= new Date()) {
      setError('開催日時は未来の日時を選択してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { createActivity, uploadActivityImage } = await import('../../services/api');

      // Upload image if provided
      let imageUrl: string | undefined;
      if (activityImage) {
        imageUrl = await uploadActivityImage(activityImage);
      }

      await createActivity({
        title: data.title,
        description: data.description,
        category: data.category,
        dateTime: data.dateTime,
        duration: data.duration,
        maxParticipants: data.maxParticipants,
        recurrence: data.recurrence,
        imageUrl,
        location,
        tags: [...new Set([...tagGroups.situation, ...tagGroups.suggested, ...tagGroups.manual])],
        ...(data.entryFee !== undefined && data.entryFee > 0 ? { entryFee: data.entryFee } : {}),
      });

      navigate('/activities');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アクティビティの作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get minimum datetime (current time + 1 hour)
  const minDateTime = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);

  // Loading state while checking profile
  if (isCheckingProfile) {
    return (
      <Layout isAuthenticated={true}>
        <div className="min-h-screen bg-base-50 dark:bg-base flex items-center justify-center">
          <Icon name="sync" size="xl" className="text-gold animate-spin" />
        </div>
      </Layout>
    );
  }

  // Profile required message
  if (hasProfile === false) {
    return (
      <Layout isAuthenticated={true}>
        <div className="min-h-screen bg-base-50 dark:bg-base py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-8">
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gold/10 flex items-center justify-center mx-auto mb-6">
                    <Icon name="person_add" size="xl" className="text-gold" />
                  </div>
                  <h2 className="text-xl font-light tracking-ryokan text-text-primary dark:text-text-dark-primary mb-3">
                    プロフィール登録が必要です
                  </h2>
                  <p className="text-text-secondary dark:text-text-dark-secondary mb-8">
                    アクティビティを作成するには、まずプロフィールを登録してください。<br />
                    あなたの情報を他のユーザーと共有し、信頼できるコミュニティを作りましょう。
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => navigate('/profile/create/step1')}
                      className="px-8 py-3 border border-gold text-gold hover:bg-gold/10 transition-all duration-base ease-elegant font-light flex items-center justify-center gap-2"
                    >
                      <Icon name="person_add" size="sm" />
                      プロフィールを作成
                    </button>
                    <button
                      onClick={() => navigate('/activities')}
                      className="px-8 py-3 border border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-secondary hover:border-gold/40 transition-all duration-base ease-elegant font-light"
                    >
                      アクティビティ一覧に戻る
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout isAuthenticated={true}>
      <div className="min-h-screen bg-base-50 dark:bg-base py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="mb-12">
              <p className="text-xs tracking-ryokan-wide text-gold uppercase mb-2">CREATE</p>
              <h1 className="text-3xl font-serif font-light tracking-ryokan text-text-primary dark:text-text-dark-primary mb-2">
                アクティビティを作成
              </h1>
              <p className="text-text-secondary dark:text-text-dark-secondary">
                仲間と楽しむアクティビティを企画しましょう
              </p>
            </div>

            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-900/10 border border-red-800/30">
                  <div className="flex items-start gap-3">
                    <Icon name="error" className="text-red-600 dark:text-red-400" />
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Image Upload */}
                <div>
                  <label className="block text-xs tracking-ryokan-wide text-text-secondary dark:text-text-dark-secondary uppercase mb-2">
                    アクティビティ画像 <span className="text-text-secondary dark:text-text-dark-muted normal-case tracking-normal">(任意)</span>
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-48 border border-dashed border-border-light dark:border-border-dark flex items-center justify-center cursor-pointer hover:border-gold/40 transition-all duration-base ease-elegant bg-transparent overflow-hidden"
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Activity" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <Icon name="add_photo_alternate" size="xl" className="text-text-secondary dark:text-text-dark-muted mx-auto mb-2" />
                        <p className="text-sm text-text-secondary dark:text-text-dark-muted">
                          クリックして画像を選択
                        </p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs tracking-ryokan-wide text-text-secondary dark:text-text-dark-secondary uppercase mb-2">
                    タイトル <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('title')}
                    className="w-full px-4 py-3 border-b border-border-light dark:border-border-dark border-t-0 border-l-0 border-r-0 bg-transparent focus:outline-none focus:border-b-gold text-text-primary dark:text-text-dark-primary"
                    placeholder="例: 週末ランニング仲間募集！"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs tracking-ryokan-wide text-text-secondary dark:text-text-dark-secondary uppercase">
                      カテゴリー <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleRecommendCategory}
                      disabled={isRecommendingCategory || !currentTitle}
                      className="text-sm text-gold border border-gold/40 hover:border-gold hover:bg-gold/5 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1 transition-all duration-base flex items-center gap-1"
                    >
                      {isRecommendingCategory ? (
                        <Icon name="sync" size="sm" className="animate-spin" />
                      ) : (
                        <Icon name="auto_awesome" size="sm" />
                      )}
                      {isRecommendingCategory ? '推薦中...' : 'AIで自動選択'}
                    </button>
                  </div>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {ACTIVITY_CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => field.onChange(cat.id)}
                            className={`
                              p-4 border transition-all duration-base ease-elegant text-center
                              ${
                                field.value === cat.id
                                  ? 'border-gold bg-gold/10'
                                  : 'border-border-light dark:border-border-dark hover:border-gold/40'
                              }
                            `}
                          >
                            <Icon name={cat.icon} size="lg" className={field.value === cat.id ? 'text-gold' : 'text-text-secondary dark:text-text-dark-muted'} />
                            <p className={`text-sm font-light mt-2 ${field.value === cat.id ? 'text-gold' : 'text-text-secondary dark:text-text-dark-secondary'}`}>
                              {cat.name}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  />
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.category.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs tracking-ryokan-wide text-text-secondary dark:text-text-dark-secondary uppercase mb-2">
                    詳細説明 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register('description')}
                    rows={6}
                    className="w-full px-4 py-3 border-b border-border-light dark:border-border-dark border-t-0 border-l-0 border-r-0 bg-transparent focus:outline-none focus:border-b-gold text-text-primary dark:text-text-dark-primary resize-none"
                    placeholder="どんなアクティビティか、参加者に何を持ってきてほしいかなど、詳しく書いてください"
                  />
                  <div className="flex justify-between items-center mt-1">
                    {errors.description && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {errors.description.message}
                      </p>
                    )}
                    <p className={`text-xs ml-auto ${descriptionLength > 1000 ? 'text-red-500' : 'text-text-secondary dark:text-text-dark-muted'}`}>
                      {descriptionLength} / 1000
                    </p>
                  </div>
                  <div className="mt-1">
                    <RefineButton
                      text={watch('description') ?? ''}
                      type="activity"
                      title={currentTitle}
                      onRefined={(refined) => setValue('description', refined)}
                    />
                  </div>
                </div>

                {/* Date Time */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs tracking-ryokan-wide text-text-secondary dark:text-text-dark-secondary uppercase mb-2">
                      開催日時 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      {...register('dateTime')}
                      min={minDateTime}
                      className="w-full px-4 py-3 border-b border-border-light dark:border-border-dark border-t-0 border-l-0 border-r-0 bg-transparent focus:outline-none focus:border-b-gold text-text-primary dark:text-text-dark-primary"
                    />
                    {errors.dateTime && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.dateTime.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs tracking-ryokan-wide text-text-secondary dark:text-text-dark-secondary uppercase mb-2">
                      所要時間 <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      name="duration"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className="w-full px-4 py-3 border-b border-border-light dark:border-border-dark border-t-0 border-l-0 border-r-0 bg-transparent focus:outline-none focus:border-b-gold text-text-primary dark:text-text-dark-primary"
                        >
                          {DURATION_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                  </div>
                </div>

                {/* Recurrence */}
                <div>
                  <label className="block text-xs tracking-ryokan-wide text-text-secondary dark:text-text-dark-secondary uppercase mb-2">
                    繰り返し
                  </label>
                  <Controller
                    name="recurrence"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="w-full px-4 py-3 border-b border-border-light dark:border-border-dark border-t-0 border-l-0 border-r-0 bg-transparent focus:outline-none focus:border-b-gold text-text-primary dark:text-text-dark-primary"
                      >
                        {RECURRENCE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs tracking-ryokan-wide text-text-secondary dark:text-text-dark-secondary uppercase mb-2">
                    集合場所 <span className="text-red-500">*</span>
                  </label>
                  <div className="p-4 border border-border-light dark:border-border-dark">
                    {/* 住所入力 */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={addressInput}
                        onChange={(e) => setAddressInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddressSearch())}
                        placeholder="例: 渋谷駅, 代々木公園, 東京都渋谷区..."
                        className="flex-1 px-3 py-2 border border-border-light dark:border-border-dark bg-transparent text-sm focus:outline-none focus:border-gold text-text-primary dark:text-text-dark-primary"
                      />
                      <button
                        type="button"
                        onClick={handleAddressSearch}
                        disabled={isGeocoding || !addressInput.trim()}
                        className="px-4 py-2 border border-gold/50 text-gold text-sm hover:bg-gold/10 transition-all disabled:opacity-50"
                      >
                        {isGeocoding ? '検索中...' : '検索'}
                      </button>
                    </div>

                    {geocodeError && (
                      <p className="text-xs text-red-400 mt-1">{geocodeError}</p>
                    )}

                    {/* または現在地を使う */}
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isGettingLocation}
                        className="text-xs text-text-secondary dark:text-text-dark-muted hover:text-gold flex items-center gap-1"
                      >
                        <Icon name="my_location" className="!text-[14px]" />
                        {isGettingLocation ? '位置情報取得中...' : '現在地を使う'}
                      </button>
                      {locationError && (
                        <p className="mt-1 text-xs text-red-400">{locationError}</p>
                      )}
                    </div>

                    {/* 取得結果表示 */}
                    {location && (
                      <div className="mt-3 flex items-start gap-2 p-3 bg-gold/5 border border-gold/20">
                        <Icon name="location_on" className="text-gold flex-shrink-0 !text-[16px] mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-text-secondary dark:text-text-dark-muted truncate">{location.address}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setLocation(null)}
                          className="text-xs text-text-secondary dark:text-text-dark-muted hover:text-red-400"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Max Participants */}
                <div>
                  <label className="block text-xs tracking-ryokan-wide text-text-secondary dark:text-text-dark-secondary uppercase mb-2">
                    最大参加者数 <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="maxParticipants"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="w-full px-4 py-3 border-b border-border-light dark:border-border-dark border-t-0 border-l-0 border-r-0 bg-transparent focus:outline-none focus:border-b-gold text-text-primary dark:text-text-dark-primary"
                      >
                        {MAX_PARTICIPANTS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>

                {/* Entry Fee */}
                <div>
                  <label className="block text-xs tracking-ryokan-wide text-text-secondary dark:text-text-dark-secondary uppercase mb-2">
                    入場料 <span className="text-text-secondary dark:text-text-dark-muted normal-case tracking-normal">(任意・円)</span>
                  </label>
                  <Controller
                    name="entryFee"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        min={0}
                        max={100000}
                        step={100}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          if (e.target.value === '') {
                            field.onChange(undefined);
                            return;
                          }
                          const parsed = parseInt(e.target.value, 10);
                          field.onChange(isNaN(parsed) ? undefined : parsed);
                        }}
                        className="w-full px-4 py-3 border-b border-border-light dark:border-border-dark border-t-0 border-l-0 border-r-0 bg-transparent focus:outline-none focus:border-b-gold text-text-primary dark:text-text-dark-primary"
                        placeholder="例: 1000（0または空欄 = 無料）"
                      />
                    )}
                  />
                  {errors.entryFee && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.entryFee.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-text-secondary dark:text-text-dark-muted">
                    入場料を設定すると、参加者はStripe決済で支払いを行います
                  </p>
                </div>

                {/* Tags */}
                <div>
                  {/* ヘッダー */}
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs tracking-ryokan-wide text-text-secondary dark:text-text-dark-secondary uppercase">
                      タグ <span className="text-text-secondary dark:text-text-dark-muted normal-case tracking-normal">(任意・最大{MAX_TAGS}個)</span>
                    </label>
                    {totalTagCount > 0 && (
                      <span className="text-xs text-text-secondary dark:text-text-dark-muted">
                        {totalTagCount} / {MAX_TAGS}
                      </span>
                    )}
                  </div>

                  {/* 状況タグ */}
                  <p className="text-xs text-text-secondary dark:text-text-dark-muted mb-2 font-light">状況・時間帯</p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {SITUATION_TAGS.map((tag) => {
                      const isSelected = tagGroups.situation.includes(tag);
                      const isDisabled = !isSelected && !canAddMore;
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleSituationTagToggle(tag)}
                          disabled={isDisabled}
                          className={`px-3 py-1.5 text-sm border transition-all duration-base ${
                            isSelected
                              ? 'border-gold bg-gold/10 text-gold'
                              : isDisabled
                                ? 'border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-muted opacity-40 cursor-not-allowed'
                                : 'border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-secondary hover:border-gold/40 hover:text-gold/80'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>

                  {/* 内容タグ */}
                  <p className="text-xs text-text-secondary dark:text-text-dark-muted mb-2 font-light">内容タグ</p>
                  <div className="mb-3">
                    <button
                      type="button"
                      onClick={handleSuggestTags}
                      disabled={isSuggestingTags || (!watch('title') && !watch('description'))}
                      className="text-sm text-gold border border-gold/40 hover:border-gold hover:bg-gold/5 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 transition-all duration-base flex items-center gap-1.5"
                    >
                      {isSuggestingTags ? (
                        <Icon name="sync" size="sm" className="animate-spin" />
                      ) : (
                        <Icon name="auto_awesome" size="sm" />
                      )}
                      {isSuggestingTags ? 'AI提案中...' : 'AIでタグを提案'}
                    </button>
                  </div>

                  {tagGroups.suggested.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {tagGroups.suggested.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleSuggestedTagToggle(tag)}
                          className="px-3 py-1.5 text-sm border border-gold bg-gold/10 text-gold transition-all duration-base flex items-center gap-1 hover:bg-gold/20"
                        >
                          {tag}
                          <span className="text-xs opacity-60">✕</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowMoreTags(prev => !prev)}
                    className="text-xs text-text-secondary dark:text-text-dark-muted hover:text-gold transition-colors flex items-center gap-1 mb-2"
                  >
                    <Icon name={showMoreTags ? 'expand_less' : 'expand_more'} size="sm" />
                    他のタグを追加
                  </button>

                  {showMoreTags && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {ACTIVITY_TAGS.map((tag) => {
                        const isInSuggested = tagGroups.suggested.includes(tag);
                        const isSelected = tagGroups.manual.includes(tag);
                        const isDisabled = !isSelected && (!canAddMore || isInSuggested);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => !isInSuggested && handleManualTagToggle(tag)}
                            disabled={isDisabled}
                            className={`px-3 py-1.5 text-sm border transition-all duration-base ${
                              isInSuggested
                                ? 'border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-muted opacity-40 cursor-not-allowed'
                                : isSelected
                                  ? 'border-gold bg-gold/10 text-gold'
                                  : isDisabled
                                    ? 'border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-muted opacity-40 cursor-not-allowed'
                                    : 'border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-secondary hover:border-gold/40 hover:text-gold/80'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {totalTagCount > 0 && (
                    <div className="mt-3 flex items-start gap-2">
                      <p className="text-xs text-text-secondary dark:text-text-dark-muted mt-0.5 shrink-0">選択中:</p>
                      <div className="flex flex-wrap gap-1">
                        {[
                          ...tagGroups.situation.map(tag => ({ tag, prefix: 'sit' })),
                          ...tagGroups.suggested.map(tag => ({ tag, prefix: 'sug' })),
                          ...tagGroups.manual.map(tag => ({ tag, prefix: 'man' })),
                        ].map(({ tag, prefix }) => (
                          <span key={`${prefix}-${tag}`} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs border border-gold/30 bg-gold/5 text-gold">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/activities')}
                    disabled={isSubmitting}
                    className="px-6 py-3 border border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-secondary hover:border-gold/40 transition-all duration-base ease-elegant font-light disabled:opacity-50"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !location}
                    className="flex-1 px-6 py-3 border border-gold text-gold hover:bg-gold/10 transition-all duration-base ease-elegant font-light flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Icon name="sync" className="animate-spin" />
                        作成中...
                      </>
                    ) : (
                      <>
                        <Icon name="add" size="sm" />
                        アクティビティを作成
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
