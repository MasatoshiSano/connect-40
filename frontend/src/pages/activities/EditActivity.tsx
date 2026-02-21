import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layout } from '../../components/layout/Layout';
import { Icon } from '../../components/ui/Icon';
import { ACTIVITY_CATEGORIES, DURATION_OPTIONS, MAX_PARTICIPANTS_OPTIONS } from '../../constants/activities';
import { RECURRENCE_OPTIONS } from '../../constants/activities';
import { RefineButton } from '../../components/ui/RefineButton';
import type { Location, Activity } from '../../types/activity';

const editActivitySchema = z.object({
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
});

type EditActivityFormData = z.infer<typeof editActivitySchema>;

export const EditActivity = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [activityImage, setActivityImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [originalActivity, setOriginalActivity] = useState<Activity | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EditActivityFormData>({
    resolver: zodResolver(editActivitySchema),
    defaultValues: {
      duration: 120,
      maxParticipants: 5,
      recurrence: 'none',
    },
  });

  const descriptionLength = watch('description')?.length || 0;

  // Load activity data
  useEffect(() => {
    const loadActivity = async () => {
      if (!activityId) {
        setError('アクティビティIDが見つかりません');
        setIsLoadingActivity(false);
        return;
      }

      try {
        const { getActivity } = await import('../../services/api');
        const activity = await getActivity(activityId);
        setOriginalActivity(activity);
        setLocation(activity.location);
        if (activity.imageUrl) {
          setImagePreview(activity.imageUrl);
        }

        // Convert dateTime to local format for datetime-local input
        const localDateTime = new Date(activity.dateTime).toISOString().slice(0, 16);

        reset({
          title: activity.title,
          description: activity.description,
          category: activity.category,
          dateTime: localDateTime,
          duration: activity.duration,
          maxParticipants: activity.maxParticipants,
          recurrence: activity.recurrence || 'none',
          tags: activity.tags.join(', '),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'アクティビティの読み込みに失敗しました');
      } finally {
        setIsLoadingActivity(false);
      }
    };

    loadActivity();
  }, [activityId, reset]);

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

  const onSubmit = async (data: EditActivityFormData) => {
    if (!location) {
      setError('開催場所を設定してください');
      return;
    }

    if (!activityId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const { updateActivity, uploadActivityImage } = await import('../../services/api');

      let imageUrl = originalActivity?.imageUrl;
      if (activityImage) {
        imageUrl = await uploadActivityImage(activityImage);
      }

      const tags = data.tags
        ? data.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag)
        : [];

      await updateActivity(activityId, {
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
      });

      navigate(`/activities/${activityId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アクティビティの更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingActivity) {
    return (
      <Layout isAuthenticated={true}>
        <div className="min-h-screen bg-base-50 dark:bg-base flex items-center justify-center">
          <Icon name="sync" size="xl" className="text-gold animate-spin" />
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
              <p className="text-xs tracking-ryokan-wide text-gold uppercase mb-2">EDIT</p>
              <h1 className="text-3xl font-serif font-light tracking-ryokan text-text-primary dark:text-text-dark-primary mb-2">
                アクティビティを編集
              </h1>
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
                        <p className="text-sm text-text-secondary dark:text-text-dark-muted">クリックして画像を選択</p>
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
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs tracking-ryokan-wide text-text-secondary dark:text-text-dark-secondary uppercase mb-3">
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
                            className={`p-4 border transition-all duration-base ease-elegant text-center ${
                              field.value === cat.id
                                ? 'border-gold bg-gold/10'
                                : 'border-border-light dark:border-border-dark hover:border-gold/40'
                            }`}
                          >
                            <Icon
                              name={cat.icon}
                              size="lg"
                              className={field.value === cat.id ? 'text-gold' : 'text-text-secondary dark:text-text-dark-muted'}
                            />
                            <p
                              className={`text-sm font-light mt-2 ${
                                field.value === cat.id ? 'text-gold' : 'text-text-secondary dark:text-text-dark-secondary'
                              }`}
                            >
                              {cat.name}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  />
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category.message}</p>
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
                  />
                  <div className="flex justify-between items-center mt-1">
                    {errors.description && (
                      <p className="text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
                    )}
                    <p className={`text-xs ml-auto ${descriptionLength > 1000 ? 'text-red-500' : 'text-text-secondary dark:text-text-dark-muted'}`}>
                      {descriptionLength} / 1000
                    </p>
                  </div>
                  <div className="flex justify-end mt-1">
                    <RefineButton
                      text={watch('description') ?? ''}
                      type="activity"
                      onRefined={(refined) => setValue('description', refined)}
                    />
                  </div>
                </div>

                {/* Date Time & Duration */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs tracking-ryokan-wide text-text-secondary dark:text-text-dark-secondary uppercase mb-2">
                      開催日時 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      {...register('dateTime')}
                      className="w-full px-4 py-3 border-b border-border-light dark:border-border-dark border-t-0 border-l-0 border-r-0 bg-transparent focus:outline-none focus:border-b-gold text-text-primary dark:text-text-dark-primary"
                    />
                    {errors.dateTime && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.dateTime.message}</p>
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
                    開催場所 <span className="text-red-500">*</span>
                  </label>
                  <div className="p-4 border border-border-light dark:border-border-dark">
                    {location ? (
                      <div className="flex items-start gap-3">
                        <Icon name="location_on" className="text-gold flex-shrink-0 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm font-light text-text-primary dark:text-text-dark-primary mb-1">
                            位置情報を取得しました
                          </p>
                          <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                            {location.address}
                          </p>
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
                    )}
                    {locationError && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400">{locationError}</p>
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

                {/* Tags */}
                <div>
                  <label className="block text-xs tracking-ryokan-wide text-text-secondary dark:text-text-dark-secondary uppercase mb-2">
                    タグ <span className="text-text-secondary dark:text-text-dark-muted normal-case tracking-normal">(任意)</span>
                  </label>
                  <input
                    type="text"
                    {...register('tags')}
                    className="w-full px-4 py-3 border-b border-border-light dark:border-border-dark border-t-0 border-l-0 border-r-0 bg-transparent focus:outline-none focus:border-b-gold text-text-primary dark:text-text-dark-primary"
                    placeholder="例: 初心者歓迎, 雨天中止, カジュアル（カンマ区切り）"
                  />
                  <p className="mt-1 text-xs text-text-secondary dark:text-text-dark-muted">
                    カンマ（,）で区切って複数のタグを入力できます
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate(`/activities/${activityId}`)}
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
                        更新中...
                      </>
                    ) : (
                      <>
                        <Icon name="save" size="sm" />
                        変更を保存
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
