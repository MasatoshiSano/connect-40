import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { successResponse, errorResponse } from '../../layers/common/nodejs/utils';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const UPLOADS_BUCKET = process.env.UPLOADS_BUCKET_NAME!;

interface GetPresignedUrlInput {
  fileName: string;
  fileType: string;
  uploadType: 'profile' | 'activity' | 'verification';
}

/**
 * Generate presigned URL for S3 upload
 * POST /uploads/presigned-url
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Get userId from authorizer
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return errorResponse(401, 'UNAUTHORIZED', 'Unauthorized');
    }

    // Parse request body
    if (!event.body) {
      return errorResponse(400, 'BAD_REQUEST', 'Request body is required');
    }

    const { fileName, fileType, uploadType }: GetPresignedUrlInput = JSON.parse(event.body);

    // Validate input
    if (!fileName || !fileType || !uploadType) {
      return errorResponse(400, 'BAD_REQUEST', 'fileName, fileType, and uploadType are required');
    }

    // Validate file type (images and PDF for verification)
    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!ALLOWED_IMAGE_TYPES.includes(fileType)) {
      return errorResponse(400, 'INVALID_FILE_TYPE', 'Only image files and PDFs are allowed (jpeg, png, gif, webp, pdf)');
    }

    // Validate upload type
    if (!(['profile', 'activity', 'verification'] as const).includes(uploadType)) {
      return errorResponse(400, 'INVALID_UPLOAD_TYPE', 'uploadType must be "profile", "activity", or "verification"');
    }

    // Generate unique file name with sanitized extension
    const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'];
    const rawExtension = fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
    const fileExtension = ALLOWED_EXTENSIONS.includes(rawExtension) ? rawExtension : 'jpg';
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const s3Key = `${uploadType}/${userId}/${uniqueFileName}`;

    // Generate presigned URL (valid for 5 minutes)
    // Note: File size is enforced by S3 bucket policy. Presigned PUT URLs
    // do not support content-length-range conditions (use presigned POST for that).
    const command = new PutObjectCommand({
      Bucket: UPLOADS_BUCKET,
      Key: s3Key,
      ContentType: fileType,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300, // 5 minutes
    });

    // Construct the public URL (will be accessible after upload)
    const publicUrl = `https://${UPLOADS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

    return successResponse({
      presignedUrl,
      publicUrl,
      key: s3Key,
      expiresIn: 300,
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to generate presigned URL');
  }
};
