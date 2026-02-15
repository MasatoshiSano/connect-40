import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layout } from '../../components/layout/Layout';
import { Icon } from '../../components/ui/Icon';
import { getUserProfile, updateUserProfile, uploadProfilePhoto } from '../../services/api';
import { INTEREST_CATEGORIES } from '../../constants/interests';
import type { UserProfile } from '../../services/api';

const editProfileSchema = z.object({
  nickname: z
    .string()
    .min(2, 'ニックネームは2文字以上である必要があります')
    .max(20, 'ニックネームは20文字以内である必要があります')
    .regex(/^[a-zA-Z0-9ぁ-んァ-ヶー一-龠]+$/, '特殊文字は使用できません'),
  age: z
    .number()
    .int('整数で入力してください')
    .min(35, '35歳以上である必要があります')
    .max(49, '49歳以下である必要があります'),
  bio: z
    .string()
    .min(10, '自己紹介は10文字以上である必要があります')
    .max(500, '自己紹介は500文字以内である必要があります'),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;

export const EditProfile = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
  });

  const bioLength = watch('bio')?.length || 0;

  // Load current profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getUserProfile();
        setProfile(data);
        setSelectedInterests(data.interests);
        setPhotoPreview(data.profilePhoto);
        reset({
          nickname: data.nickname,
          age: data.age,
          bio: data.bio || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'プロフィールの読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [reset]);

  // Update photo preview when file changes
  useEffect(() => {
    if (profilePhoto) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(profilePhoto);
    }
  }, [profilePhoto]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    setProfilePhoto(file);
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interest)) {
        return prev.filter((i) => i !== interest);
      } else {
        if (prev.length >= 10) {
          setError('最大10個まで選択できます');
          return prev;
        }
        return [...prev, interest];
      }
    });
  };

  const onSubmit = async (data: EditProfileFormData) => {
    if (selectedInterests.length < 3) {
      setError('興味・趣味は最低3個選択してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      let photoUrl = profile?.profilePhoto;

      // Upload new photo if changed
      if (profilePhoto) {
        photoUrl = await uploadProfilePhoto(profilePhoto);
      }

      // Update profile
      await updateUserProfile({
        nickname: data.nickname,
        age: data.age,
        bio: data.bio,
        interests: selectedInterests,
        ...(photoUrl && { profilePhoto: photoUrl }),
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プロフィールの更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout isAuthenticated={true}>
        <div className="min-h-screen flex items-center justify-center">
          <Icon name="sync" size="xl" className="text-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout isAuthenticated={true}>
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                プロフィール編集
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                あなたのプロフィールを更新しましょう
              </p>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-lg p-8">
              {/* Success Message */}
              {success && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Icon name="check_circle" className="text-green-600 dark:text-green-400" />
                    <p className="text-sm text-green-600 dark:text-green-400">
                      プロフィールが更新されました
                    </p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Icon name="error" className="text-red-600 dark:text-red-400" />
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Profile Photo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    プロフィール写真
                  </label>
                  <div className="flex flex-col items-center gap-4">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition border-4 border-gray-200 dark:border-gray-600"
                    >
                      {photoPreview ? (
                        <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <Icon name="add_a_photo" size="xl" className="text-gray-400" />
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
                    >
                      写真を変更
                    </button>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">基本情報</h3>

                  {/* Nickname */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ニックネーム <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('nickname')}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    {errors.nickname && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.nickname.message}
                      </p>
                    )}
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      年齢 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      {...register('age', { valueAsNumber: true })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      min={35}
                      max={49}
                    />
                    {errors.age && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.age.message}
                      </p>
                    )}
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      自己紹介 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      {...register('bio')}
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                    />
                    <div className="flex justify-between items-center mt-1">
                      {errors.bio && (
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {errors.bio.message}
                        </p>
                      )}
                      <p className={`text-xs ml-auto ${bioLength > 500 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                        {bioLength} / 500
                      </p>
                    </div>
                  </div>
                </div>

                {/* Interests */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      興味・趣味 <span className="text-red-500">*</span>
                    </h3>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedInterests.length} / 10
                    </span>
                  </div>

                  {INTEREST_CATEGORIES.map((category) => (
                    <div key={category.id}>
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                        {category.name}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {category.interests.map((interest) => {
                          const isSelected = selectedInterests.includes(interest);
                          return (
                            <button
                              key={interest}
                              type="button"
                              onClick={() => toggleInterest(interest)}
                              className={`
                                px-4 py-2 rounded-full font-medium transition-all
                                ${
                                  isSelected
                                    ? 'bg-primary text-white shadow-md'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }
                              `}
                            >
                              {isSelected && <Icon name="check" size="sm" className="inline mr-1" />}
                              {interest}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    disabled={isSubmitting}
                    className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold disabled:opacity-50"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || selectedInterests.length < 3}
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
