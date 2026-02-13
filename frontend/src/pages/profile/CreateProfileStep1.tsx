import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon';
import { ProfileCreationLayout } from '../../components/profile/ProfileCreationLayout';
import { useProfileCreation } from '../../contexts/ProfileCreationContext';

const step1Schema = z.object({
  nickname: z
    .string()
    .min(2, 'ニックネームは2文字以上である必要があります')
    .max(20, 'ニックネームは20文字以内である必要があります')
    .regex(/^[a-zA-Z0-9ぁ-んァ-ヶー一-龠]+$/, '特殊文字は使用できません'),
  age: z
    .number({ invalid_type_error: '年齢を入力してください' })
    .int('整数で入力してください')
    .min(35, '35歳以上である必要があります')
    .max(49, '49歳以下である必要があります'),
  bio: z
    .string()
    .min(10, '自己紹介は10文字以上である必要があります')
    .max(500, '自己紹介は500文字以内である必要があります'),
});

type Step1FormData = z.infer<typeof step1Schema>;

export const CreateProfileStep1 = () => {
  const navigate = useNavigate();
  const { formData, updateFormData, setCurrentStep } = useProfileCreation();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      nickname: formData.nickname,
      age: formData.age || undefined,
      bio: formData.bio,
    },
  });

  const bioLength = watch('bio')?.length || 0;

  const onSubmit = (data: Step1FormData) => {
    updateFormData({
      nickname: data.nickname,
      age: data.age,
      bio: data.bio,
    });
    setCurrentStep(2);
    navigate('/profile/create/step2');
  };

  return (
    <ProfileCreationLayout>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            基本情報
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            まずは基本的な情報を教えてください
          </p>
        </div>

        {/* Nickname */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ニックネーム <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('nickname')}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="例: タロウ"
          />
          {errors.nickname && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.nickname.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            他のユーザーに表示される名前です
          </p>
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
            placeholder="例: 40"
            min={35}
            max={49}
          />
          {errors.age && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.age.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            35〜49歳の方がご利用いただけます
          </p>
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
            placeholder="あなたの趣味や興味、どんな仲間と出会いたいかなどを書いてください"
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

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Icon name="info" className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-semibold mb-1">プロフィールのヒント</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                <li>具体的な趣味や興味を書くと、共通点のある人と出会いやすくなります</li>
                <li>前向きで親しみやすい文章を心がけましょう</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold"
          >
            後で作成
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition font-semibold flex items-center justify-center gap-2"
          >
            次へ進む
            <Icon name="arrow_forward" size="sm" />
          </button>
        </div>
      </form>
    </ProfileCreationLayout>
  );
};
