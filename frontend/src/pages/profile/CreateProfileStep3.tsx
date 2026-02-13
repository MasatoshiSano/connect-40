import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon';
import { ProfileCreationLayout } from '../../components/profile/ProfileCreationLayout';
import { useProfileCreation } from '../../contexts/ProfileCreationContext';

export const CreateProfileStep3 = () => {
  const navigate = useNavigate();
  const { formData, updateFormData, setCurrentStep, resetForm } = useProfileCreation();
  const [profilePhoto, setProfilePhoto] = useState<File | null>(formData.profilePhoto);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [location, setLocation] = useState(formData.location);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentStep(3);
  }, [setCurrentStep]);

  // Set preview from existing file
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('ファイルサイズは5MB以下にしてください');
      return;
    }

    setError(null);
    setProfilePhoto(file);
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
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

        // Get address from reverse geocoding
        // TODO: Implement reverse geocoding API call
        // For now, just store coordinates
        const locationData = {
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
            ? '位置情報の利用が許可されていません。ブラウザの設定を確認してください'
            : '位置情報の取得に失敗しました。もう一度お試しください'
        );
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleBack = () => {
    updateFormData({ profilePhoto, location });
    setCurrentStep(2);
    navigate('/profile/create/step2');
  };

  const handleSubmit = async () => {
    if (!profilePhoto) {
      setError('プロフィール写真を選択してください');
      return;
    }

    if (!location) {
      setError('位置情報を取得してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Upload profile photo to S3
      const { uploadProfilePhoto, createUserProfile } = await import('../../services/api');
      const photoUrl = await uploadProfilePhoto(profilePhoto);

      // Create user profile
      await createUserProfile({
        nickname: formData.nickname,
        age: formData.age!,
        bio: formData.bio,
        interests: formData.interests,
        profilePhoto: photoUrl,
        location,
      });

      // Update form data with final values
      updateFormData({ profilePhoto, location });

      // Reset form and navigate to success page
      resetForm();
      navigate('/profile/create/success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プロフィールの作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProfileCreationLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            本人確認
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            プロフィール写真と位置情報を設定してください
          </p>
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

        {/* Profile Photo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            プロフィール写真 <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-col items-center gap-4">
            <div
              onClick={handlePhotoClick}
              className="w-40 h-40 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition border-4 border-gray-200 dark:border-gray-600"
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
              onClick={handlePhotoClick}
              className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
            >
              {profilePhoto ? '写真を変更' : '写真を選択'}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            最大5MB、JPEG/PNG形式
          </p>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            位置情報 <span className="text-red-500">*</span>
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
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            位置情報は市区町村レベルでのみ表示され、近くのユーザーとマッチングする際に使用されます
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Icon name="info" className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-semibold mb-1">プライバシーについて</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                <li>写真は他のユーザーに公開されます</li>
                <li>詳細な位置情報は非公開で、市区町村レベルでのみ表示されます</li>
                <li>本人確認後、安全にマッチングを開始できます</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={handleBack}
            disabled={isSubmitting}
            className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            <Icon name="arrow_back" size="sm" />
            戻る
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !profilePhoto || !location}
            className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Icon name="sync" className="animate-spin" />
                作成中...
              </>
            ) : (
              <>
                <Icon name="check" size="sm" />
                プロフィール作成完了
              </>
            )}
          </button>
        </div>
      </div>
    </ProfileCreationLayout>
  );
};
