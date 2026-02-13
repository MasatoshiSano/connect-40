import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon';
import { ProfileCreationLayout } from '../../components/profile/ProfileCreationLayout';
import { useProfileCreation } from '../../contexts/ProfileCreationContext';
import { INTEREST_CATEGORIES } from '../../constants/interests';

const MIN_INTERESTS = 3;
const MAX_INTERESTS = 10;

export const CreateProfileStep2 = () => {
  const navigate = useNavigate();
  const { formData, updateFormData, setCurrentStep } = useProfileCreation();
  const [selectedInterests, setSelectedInterests] = useState<string[]>(formData.interests);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentStep(2);
  }, [setCurrentStep]);

  const toggleInterest = (interest: string) => {
    setError(null);
    setSelectedInterests((prev) => {
      if (prev.includes(interest)) {
        return prev.filter((i) => i !== interest);
      } else {
        if (prev.length >= MAX_INTERESTS) {
          setError(`最大${MAX_INTERESTS}個まで選択できます`);
          return prev;
        }
        return [...prev, interest];
      }
    });
  };

  const handleBack = () => {
    updateFormData({ interests: selectedInterests });
    setCurrentStep(1);
    navigate('/profile/create/step1');
  };

  const handleNext = () => {
    if (selectedInterests.length < MIN_INTERESTS) {
      setError(`最低${MIN_INTERESTS}個選択してください`);
      return;
    }

    updateFormData({ interests: selectedInterests });
    setCurrentStep(3);
    navigate('/profile/create/step3');
  };

  return (
    <ProfileCreationLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            興味・趣味
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            あなたの興味や趣味を選択してください（{MIN_INTERESTS}〜{MAX_INTERESTS}個）
          </p>
        </div>

        {/* Selection Counter */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            選択中: {selectedInterests.length} / {MAX_INTERESTS}
          </span>
          {selectedInterests.length >= MIN_INTERESTS && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <Icon name="check_circle" size="sm" />
              <span className="text-sm font-medium">必要数クリア</span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Icon name="error" className="text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Interest Categories */}
        <div className="space-y-6">
          {INTEREST_CATEGORIES.map((category) => (
            <div key={category.id}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                {category.name}
              </h3>
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

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Icon name="info" className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-semibold mb-1">興味・趣味の選び方</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                <li>共通の趣味を持つ仲間と出会いやすくなります</li>
                <li>幅広いジャンルから選ぶと、出会いの機会が増えます</li>
                <li>後からプロフィール編集で変更できます</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={handleBack}
            className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold flex items-center gap-2"
          >
            <Icon name="arrow_back" size="sm" />
            戻る
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={selectedInterests.length < MIN_INTERESTS}
            className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            次へ進む
            <Icon name="arrow_forward" size="sm" />
          </button>
        </div>
      </div>
    </ProfileCreationLayout>
  );
};
