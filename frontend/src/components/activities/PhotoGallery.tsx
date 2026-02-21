import { useState, useEffect, useCallback } from 'react';
import { Icon } from '../ui/Icon';
import { PhotoUpload } from './PhotoUpload';

interface Photo {
  photoId: string;
  activityId: string;
  userId: string;
  nickname: string;
  photoUrl: string;
  createdAt: string;
}

interface PhotoGalleryProps {
  activityId: string;
  isParticipant: boolean;
}

export const PhotoGallery = ({ activityId, isParticipant }: PhotoGalleryProps) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const loadPhotos = useCallback(async () => {
    try {
      const { getActivityPhotos } = await import('../../services/api');
      const result = await getActivityPhotos(activityId);
      setPhotos(result.photos);
    } catch (err) {
      console.error('Failed to load photos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const handleUploadComplete = () => {
    setShowUpload(false);
    loadPhotos();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Icon name="sync" size="lg" className="text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs tracking-ryokan-wide text-text-secondary dark:text-text-secondary dark:text-text-dark-muted uppercase">
          フォトギャラリー ({photos.length})
        </h3>
        {isParticipant && (
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="px-3 py-1 border border-gold/30 text-gold text-sm hover:bg-gold/10 transition-all duration-base ease-elegant flex items-center gap-1"
          >
            <Icon name="add_photo_alternate" size="sm" />
            写真を追加
          </button>
        )}
      </div>

      {showUpload && (
        <div className="mb-6">
          <PhotoUpload
            activityId={activityId}
            onComplete={handleUploadComplete}
            onCancel={() => setShowUpload(false)}
          />
        </div>
      )}

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {photos.map((photo) => (
            <button
              key={photo.photoId}
              onClick={() => setSelectedPhoto(photo)}
              className="aspect-square overflow-hidden bg-elevated-light dark:bg-elevated-dark group"
            >
              <img
                src={photo.photoUrl}
                alt={`Photo by ${photo.nickname}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-base"
              />
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-elevated-light dark:bg-elevated-dark border border-border-light dark:border-border-dark p-8 text-center">
          <Icon name="photo_library" size="xl" className="text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-secondary dark:text-text-dark-muted">
            まだ写真がありません
          </p>
          {isParticipant && (
            <p className="text-xs text-text-secondary dark:text-text-dark-muted mt-1">
              参加者は写真をアップロードできます
            </p>
          )}
        </div>
      )}

      {/* Lightbox overlay */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-modal bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-0 text-white hover:text-gold transition-colors"
            >
              <Icon name="close" size="lg" />
            </button>
            <img
              src={selectedPhoto.photoUrl}
              alt={`Photo by ${selectedPhoto.nickname}`}
              className="w-full h-full object-contain"
            />
            <div className="mt-3 text-center">
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                {selectedPhoto.nickname} - {new Date(selectedPhoto.createdAt).toLocaleDateString('ja-JP')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
