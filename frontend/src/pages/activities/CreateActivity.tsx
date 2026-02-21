import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layout } from '../../components/layout/Layout';
import { Icon } from '../../components/ui/Icon';
import { ACTIVITY_CATEGORIES, DURATION_OPTIONS, MAX_PARTICIPANTS_OPTIONS, RECURRENCE_OPTIONS } from '../../constants/activities';
import type { Location } from '../../types/activity';

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
  tags: z.string().optional(),
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
  const [activityImage, setActivityImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    watch,
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
      (error) => {
        console.error('Geolocation error:', error);
        setLocationError(
          error.code === 1
            ? '位置情報の利用が許可されていません'
            : '位置情報の取得に失敗しました'
        );
        setIsGettingLocation(false);
      }
    );
  };

  const onSubmit = async (data: CreateActivityFormData) => {
    if (!location) {
      setError('開催場所を設定してください');
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

      const tags = data.tags
        ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : [];

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
        tags,
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
        <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center">
          <Icon name="sync" size="xl" className="text-gold animate-spin" />
        </div>
      </Layout>
    );
  }

  // Profile required message
  if (hasProfile === false) {
    return (
      <Layout isAuthenticated={true}>
        <div className="min-h-screen bg-bg-light dark:bg-bg-dark py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="bg-surface-dark border border-border-dark p-8">
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
                      className="px-8 py-3 border border-border-dark text-text-secondary dark:text-text-dark-secondary hover:border-gold/40 transition-all duration-base ease-elegant font-light"
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
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark py-12">
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

            <div className="bg-surface-dark border border-border-dark p-8">
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
                  <label className="block text-xs tracking-ryokan-wide text-text-dark-secondary uppercase mb-2">
                    アクティビティ画像 <span className="text-text-dark-muted normal-case tracking-normal">(任意)</span>
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-48 border border-dashed border-border-dark flex items-center justify-center cursor-pointer hover:border-gold/40 transition-all duration-base ease-elegant bg-transparent overflow-hidden"
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Activity" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <Icon name="add_photo_alternate" size="xl" className="text-text-dark-muted mx-auto mb-2" />
                        <p className="text-sm text-text-dark-muted">
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
                  <label className="block text-xs tracking-ryokan-wide text-text-dark-secondary uppercase mb-2">
                    タイトル <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('title')}
                    className="w-full px-4 py-3 border-b border-border-dark border-t-0 border-l-0 border-r-0 bg-transparent focus:outline-none focus:border-b-gold text-text-primary dark:text-text-dark-primary"
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
                  <label className="block text-xs tracking-ryokan-wide text-text-dark-secondary uppercase mb-3">
                    カテゴリー <span className="text-red-500">*</span>
                  </label>
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
                                  : 'border-border-dark hover:border-gold/40'
                              }
                            `}
                          >
                            <Icon name={cat.icon} size="lg" className={field.value === cat.id ? 'text-gold' : 'text-text-dark-muted'} />
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
                  <label className="block text-xs tracking-ryokan-wide text-text-dark-secondary uppercase mb-2">
                    詳細説明 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register('description')}
                    rows={6}
                    className="w-full px-4 py-3 border-b border-border-dark border-t-0 border-l-0 border-r-0 bg-transparent focus:outline-none focus:border-b-gold text-text-primary dark:text-text-dark-primary resize-none"
                    placeholder="どんなアクティビティか、参加者に何を持ってきてほしいかなど、詳しく書いてください"
                  />
                  <div className="flex justify-between items-center mt-1">
                    {errors.description && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {errors.description.message}
                      </p>
                    )}
                    <p className={`text-xs ml-auto ${descriptionLength > 1000 ? 'text-red-500' : 'text-text-dark-muted'}`}>
                      {descriptionLength} / 1000
                    </p>
                  </div>
                </div>

                {/* Date Time */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs tracking-ryokan-wide text-text-dark-secondary uppercase mb-2">
                      開催日時 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      {...register('dateTime')}
                      min={minDateTime}
                      className="w-full px-4 py-3 border-b border-border-dark border-t-0 border-l-0 border-r-0 bg-transparent focus:outline-none focus:border-b-gold text-text-primary dark:text-text-dark-primary"
                    />
                    {errors.dateTime && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.dateTime.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs tracking-ryokan-wide text-text-dark-secondary uppercase mb-2">
                      所要時間 <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      name="duration"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className="w-full px-4 py-3 border-b border-border-dark border-t-0 border-l-0 border-r-0 bg-transparent focus:outline-none focus:border-b-gold text-text-primary dark:text-text-dark-primary"
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
                  <label className="block text-xs tracking-ryokan-wide text-text-dark-secondary uppercase mb-2">
                    繰り返し
                  </label>
                  <Controller
                    name="recurrence"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="w-full px-4 py-3 border-b border-border-dark border-t-0 border-l-0 border-r-0 bg-transparent focus:outline-none focus:border-b-gold text-text-primary dark:text-text-dark-primary"
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
                  <label className="block text-xs tracking-ryokan-wide text-text-dark-secondary uppercase mb-2">
                    開催場所 <span className="text-red-500">*</span>
                  </label>
                  <div className="p-4 border border-border-dark">
                    {location ? (
                      <div className="flex items-start gap-3">
                        <Icon name="location_on" className="text-gold flex-shrink-0 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm font-light text-text-primary dark:text-text-dark-primary mb-1">
                            位置情報を取得しました
                          </p>
                          <p className="text-xs text-text-secondary dark:text-text-dark-secondary">{location.address}</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleGetLocation}
                          disabled={isGettingLocation}
                          className="text-sm text-gold hover:text-gold/80 transition-all duration-base ease-elegant"
                        >
                          再取得
                        </button>
                      </div>
                    ) : (
                      <div>
                        <button
                          type="button"
                          onClick={handleGetLocation}
                          disabled={isGettingLocation}
                          className="w-full py-3 border border-gold text-gold hover:bg-gold/10 transition-all duration-base ease-elegant font-light flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isGettingLocation ? (
                            <>
                              <Icon name="sync" className="animate-spin" />
                              位置情報を取得中...
                            </>
                          ) : (
                            <>
                              <Icon name="my_location" />
                              現在地を取得
                            </>
                          )}
                        </button>
                        {locationError && (
                          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{locationError}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Max Participants */}
                <div>
                  <label className="block text-xs tracking-ryokan-wide text-text-dark-secondary uppercase mb-2">
                    最大参加者数 <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="maxParticipants"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="w-full px-4 py-3 border-b border-border-dark border-t-0 border-l-0 border-r-0 bg-transparent focus:outline-none focus:border-b-gold text-text-primary dark:text-text-dark-primary"
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
                  <label className="block text-xs tracking-ryokan-wide text-text-dark-secondary uppercase mb-2">
                    入場料 <span className="text-text-dark-muted normal-case tracking-normal">(任意・円)</span>
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
                        className="w-full px-4 py-3 border-b border-border-dark border-t-0 border-l-0 border-r-0 bg-transparent focus:outline-none focus:border-b-gold text-text-primary dark:text-text-dark-primary"
                        placeholder="例: 1000（0または空欄 = 無料）"
                      />
                    )}
                  />
                  {errors.entryFee && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.entryFee.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-text-dark-muted">
                    入場料を設定すると、参加者はStripe決済で支払いを行います
                  </p>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs tracking-ryokan-wide text-text-dark-secondary uppercase mb-2">
                    タグ <span className="text-text-dark-muted normal-case tracking-normal">(任意)</span>
                  </label>
                  <input
                    type="text"
                    {...register('tags')}
                    className="w-full px-4 py-3 border-b border-border-dark border-t-0 border-l-0 border-r-0 bg-transparent focus:outline-none focus:border-b-gold text-text-primary dark:text-text-dark-primary"
                    placeholder="例: 初心者歓迎, 雨天中止, カジュアル（カンマ区切り）"
                  />
                  <p className="mt-1 text-xs text-text-dark-muted">
                    カンマ（,）で区切って複数のタグを入力できます
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/activities')}
                    disabled={isSubmitting}
                    className="px-6 py-3 border border-border-dark text-text-secondary dark:text-text-dark-secondary hover:border-gold/40 transition-all duration-base ease-elegant font-light disabled:opacity-50"
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
