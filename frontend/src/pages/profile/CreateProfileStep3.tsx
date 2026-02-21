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

        // Get address from reverse geocoding using Nominatim API
        let address = `緯度: ${latitude.toFixed(4)}, 経度: ${longitude.toFixed(4)}`;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ja`,
            {
              headers: {
                'User-Agent': 'Connect40 App',
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            // Extract human-readable address from response
            if (data.address) {
              const parts = [];
              if (data.address.city || data.address.town || data.address.village) {
                parts.push(data.address.city || data.address.town || data.address.village);
              }
              if (data.address.suburb || data.address.neighbourhood) {
                parts.push(data.address.suburb || data.address.neighbourhood);
              }
              if (data.address.state) {
                parts.push(data.address.state);
              }
              if (parts.length > 0) {
                address = parts.join(', ');
              } else if (data.display_name) {
                // Fallback to display_name
                address = data.display_name;
              }
            }
          }
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          // Continue with coordinates as fallback
        }

        const locationData = {
          latitude,
          longitude,
          address,
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
          <h2 className="text-2xl font-serif font-light tracking-ryokan text-text-primary dark:text-text-dark-primary mb-2">
            本人確認
          </h2>
          <p className="text-text-secondary dark:text-text-dark-secondary font-light">
            プロフィール写真と位置情報を設定してください
          </p>
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

        {/* Profile Photo */}
        <div>
          <label className="block text-xs font-light tracking-ryokan-wide uppercase text-text-secondary dark:text-text-dark-secondary mb-2">
            プロフィール写真 <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-col items-center gap-4">
            <div
              onClick={handlePhotoClick}
              className="w-40 h-40 rounded-full overflow-hidden bg-elevated-light dark:bg-elevated-dark flex items-center justify-center cursor-pointer hover:bg-gold/5 transition duration-base border-4 border-border-light dark:border-border-dark"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <Icon name="add_a_photo" size="xl" className="text-text-secondary dark:text-text-dark-muted" />
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
              className="px-6 py-2 border border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-secondary hover:border-gold/40 hover:text-gold transition duration-base font-light"
            >
              {profilePhoto ? '写真を変更' : '写真を選択'}
            </button>
          </div>
          <p className="mt-2 text-xs text-text-muted dark:text-text-dark-muted text-center font-light">
            最大5MB、JPEG/PNG形式
          </p>
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-light tracking-ryokan-wide uppercase text-text-secondary dark:text-text-dark-secondary mb-2">
            位置情報 <span className="text-red-500">*</span>
          </label>
          <div className="p-4 bg-elevated-light dark:bg-elevated-dark border border-border-light dark:border-border-dark">
            {location ? (
              <div className="flex items-start gap-3">
                <Icon name="location_on" className="text-gold flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-sm font-light text-text-primary dark:text-text-dark-primary mb-1">
                    位置情報を取得しました
                  </p>
                  <p className="text-xs text-text-secondary dark:text-text-dark-secondary font-light">{location.address}</p>
                </div>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isGettingLocation}
                  className="text-sm text-gold hover:text-gold/80 font-light"
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
                  className="w-full py-3 border border-gold text-gold hover:bg-gold/10 transition duration-base font-light flex items-center justify-center gap-2 disabled:opacity-50"
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
                  <p className="mt-2 text-sm text-red-400 font-light">{locationError}</p>
                )}
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-text-muted dark:text-text-dark-muted font-light">
            位置情報は市区町村レベルでのみ表示され、近くのユーザーとマッチングする際に使用されます
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-gold/5 border border-gold/20 p-4">
          <div className="flex items-start gap-3">
            <Icon name="info" className="text-gold flex-shrink-0" />
            <div className="text-sm text-text-secondary dark:text-text-dark-secondary font-light">
              <p className="font-light mb-1 text-text-primary dark:text-text-dark-primary">プライバシーについて</p>
              <ul className="list-disc list-inside space-y-1">
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
            className="px-6 py-3 border border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-secondary hover:bg-gold/5 transition duration-base font-light flex items-center gap-2 disabled:opacity-50"
          >
            <Icon name="arrow_back" size="sm" />
            戻る
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !profilePhoto || !location}
            className="flex-1 px-6 py-3 border border-gold text-gold hover:bg-gold/10 transition duration-base font-light flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
