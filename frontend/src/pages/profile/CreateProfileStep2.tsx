import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon';
import { ProfileCreationLayout } from '../../components/profile/ProfileCreationLayout';
import { useProfileCreation } from '../../contexts/ProfileCreationContext';
import { INTEREST_CATEGORIES } from '../../constants/interests';
import { InterestCard } from '../../components/interests/InterestCard';
import { useInterestPhotos } from '../../hooks/useInterestPhotos';

const MIN_INTERESTS = 3;
const MAX_INTERESTS = 10;

export const CreateProfileStep2 = () => {
  const navigate = useNavigate();
  const { formData, updateFormData, setCurrentStep } = useProfileCreation();
  const [selectedInterests, setSelectedInterests] = useState<string[]>(formData.interests);
  const [error, setError] = useState<string | null>(null);
  const allInterests = INTEREST_CATEGORIES.flatMap((c) => c.interests);
  const interestPhotos = useInterestPhotos(allInterests);

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
          <h2 className="text-2xl font-serif font-light tracking-ryokan text-text-primary dark:text-text-dark-primary mb-2">
            興味・趣味
          </h2>
          <p className="text-text-secondary dark:text-text-dark-secondary font-light">
            あなたの興味や趣味を選択してください（{MIN_INTERESTS}〜{MAX_INTERESTS}個）
          </p>
        </div>

        {/* Selection Counter */}
        <div className="flex items-center justify-between p-4 bg-elevated-dark border border-border-dark">
          <span className="text-sm font-light text-text-secondary dark:text-text-dark-secondary">
            選択中: {selectedInterests.length} / {MAX_INTERESTS}
          </span>
          {selectedInterests.length >= MIN_INTERESTS && (
            <div className="flex items-center gap-2 text-gold">
              <Icon name="check_circle" size="sm" />
              <span className="text-sm font-light">必要数クリア</span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-800">
            <div className="flex items-start gap-3">
              <Icon name="error" className="text-red-400" />
              <p className="text-sm text-red-400 font-light">{error}</p>
            </div>
          </div>
        )}

        {/* Interest Categories */}
        <div className="space-y-6">
          {INTEREST_CATEGORIES.map((category) => (
            <div key={category.id}>
              <h3 className="text-lg font-serif font-light tracking-wide text-text-primary dark:text-text-dark-primary mb-3 flex items-center gap-2">
                {category.name}
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {category.interests.map((interest) => (
                  <InterestCard
                    key={interest}
                    interest={interest}
                    photoUrl={interestPhotos.get(interest)}
                    isSelected={selectedInterests.includes(interest)}
                    onToggle={toggleInterest}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="bg-gold/5 border border-gold/20 p-4">
          <div className="flex items-start gap-3">
            <Icon name="info" className="text-gold flex-shrink-0" />
            <div className="text-sm text-text-dark-secondary font-light">
              <p className="font-light mb-1 text-text-primary dark:text-text-dark-primary">興味・趣味の選び方</p>
              <ul className="list-disc list-inside space-y-1">
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
            className="px-6 py-3 border border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-secondary hover:bg-gold/5 transition duration-base font-light flex items-center gap-2"
          >
            <Icon name="arrow_back" size="sm" />
            戻る
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={selectedInterests.length < MIN_INTERESTS}
            className="flex-1 px-6 py-3 border border-gold text-gold hover:bg-gold/10 transition duration-base font-light flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            次へ進む
            <Icon name="arrow_forward" size="sm" />
          </button>
        </div>
      </div>
    </ProfileCreationLayout>
  );
};
