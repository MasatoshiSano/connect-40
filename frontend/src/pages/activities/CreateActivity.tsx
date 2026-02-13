import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layout } from '../../components/layout/Layout';
import { Icon } from '../../components/ui/Icon';
import { ACTIVITY_CATEGORIES, DURATION_OPTIONS, MAX_PARTICIPANTS_OPTIONS } from '../../constants/activities';
import type { ActivityCategory, Location } from '../../types/activity';

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
  tags: z.string().optional(),
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
    },
  });

  const descriptionLength = watch('description')?.length || 0;

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
      // TODO: Upload image if provided
      // TODO: Create activity API call
      /*
      const { createActivity, uploadActivityImage } = await import('../../services/api');

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
        location,
        imageUrl,
        tags,
      });
      */

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      navigate('/activities');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アクティビティの作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get minimum datetime (current time + 1 hour)
  const minDateTime = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <Layout isAuthenticated={true}>
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                アクティビティを作成
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                仲間と楽しむアクティビティを企画しましょう
              </p>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-lg p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Icon name="error" className="text-red-600 dark:text-red-400" />
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    アクティビティ画像 <span className="text-gray-400">(任意)</span>
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition bg-gray-50 dark:bg-gray-800 overflow-hidden"
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Activity" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <Icon name="add_photo_alternate" size="xl" className="text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    タイトル <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('title')}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
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
                              p-4 rounded-lg border-2 transition text-center
                              ${
                                field.value === cat.id
                                  ? 'border-primary bg-primary-50 dark:bg-primary-900/20'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                              }
                            `}
                          >
                            <Icon name={cat.icon} size="lg" className={field.value === cat.id ? 'text-primary' : 'text-gray-500'} />
                            <p className={`text-sm font-medium mt-2 ${field.value === cat.id ? 'text-primary' : 'text-gray-700 dark:text-gray-300'}`}>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    詳細説明 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register('description')}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                    placeholder="どんなアクティビティか、参加者に何を持ってきてほしいかなど、詳しく書いてください"
                  />
                  <div className="flex justify-between items-center mt-1">
                    {errors.description && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {errors.description.message}
                      </p>
                    )}
                    <p className={`text-xs ml-auto ${descriptionLength > 1000 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                      {descriptionLength} / 1000
                    </p>
                  </div>
                </div>

                {/* Date Time */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      開催日時 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      {...register('dateTime')}
                      min={minDateTime}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    {errors.dateTime && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.dateTime.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      所要時間 <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      name="duration"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    開催場所 <span className="text-red-500">*</span>
                  </label>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    {location ? (
                      <div className="flex items-start gap-3">
                        <Icon name="location_on" className="text-primary flex-shrink-0 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            位置情報を取得しました
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{location.address}</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleGetLocation}
                          disabled={isGettingLocation}
                          className="text-sm text-primary hover:underline"
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
                          className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    最大参加者数 <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="maxParticipants"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    タグ <span className="text-gray-400">(任意)</span>
                  </label>
                  <input
                    type="text"
                    {...register('tags')}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="例: 初心者歓迎, 雨天中止, カジュアル（カンマ区切り）"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    カンマ（,）で区切って複数のタグを入力できます
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/activities')}
                    disabled={isSubmitting}
                    className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold disabled:opacity-50"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !location}
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
