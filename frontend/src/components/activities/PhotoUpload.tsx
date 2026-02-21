import { useState, useRef } from 'react';
import { Icon } from '../ui/Icon';

interface PhotoUploadProps {
  activityId: string;
  onComplete: () => void;
  onCancel: () => void;
}

export const PhotoUpload = ({ activityId, onComplete, onCancel }: PhotoUploadProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('画像ファイルのみアップロードできます');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('ファイルサイズは10MB以下にしてください');
      return;
    }

    setError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const { uploadActivityPhoto } = await import('../../services/api');
      const result = await uploadActivityPhoto(activityId, selectedFile.name, selectedFile.type);

      // Upload to S3 using presigned URL
      const uploadResponse = await fetch(result.presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': selectedFile.type },
        body: selectedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to S3');
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-elevated-light dark:bg-elevated-dark border border-border-light dark:border-border-dark p-4">
      {!previewUrl ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border-light dark:border-border-dark hover:border-gold/40 p-8 text-center cursor-pointer transition-colors duration-base"
        >
          <Icon name="cloud_upload" size="xl" className="text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-secondary dark:text-text-dark-muted">
            クリックして画像を選択
          </p>
          <p className="text-xs text-text-secondary dark:text-text-dark-muted mt-1">
            JPG, PNG, WebP (最大10MB)
          </p>
        </div>
      ) : (
        <div>
          <div className="aspect-video overflow-hidden mb-4 bg-black">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1 py-2 border border-gold text-gold hover:bg-gold/10 transition-all duration-base ease-elegant font-light flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Icon name="sync" size="sm" className="animate-spin" />
                  アップロード中...
                </>
              ) : (
                <>
                  <Icon name="upload" size="sm" />
                  アップロード
                </>
              )}
            </button>
            <button
              onClick={onCancel}
              disabled={isUploading}
              className="px-4 py-2 border border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-muted hover:text-gold transition-colors duration-base"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <div className="mt-3 p-2 bg-red-900/10 border border-red-800/30">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
};
