import { Injectable } from '@nestjs/common';
import { generatePresignedUploadUrl, getFileUrl } from '../lib/s3';
import { GenerateUploadUrlDto } from './dto/generate-upload-url.dto';

@Injectable()
export class UploadService {
  async generatePresignedUrl(dto: GenerateUploadUrlDto) {
    const { uploadUrl, cloud_storage_path } =
      await generatePresignedUploadUrl(
        dto.fileName,
        dto.contentType,
        true, // Always public for product images
      );

    // Generate the public URL that will be used after upload
    const publicUrl = await getFileUrl(cloud_storage_path, true);

    return {
      uploadUrl,
      publicUrl,
      cloud_storage_path,
    };
  }
}
