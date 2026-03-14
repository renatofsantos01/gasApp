import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UploadService } from './upload.service';
import { GenerateUploadUrlDto } from './dto/generate-upload-url.dto';

@ApiTags('upload')
@Controller('upload')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('presigned')
  @ApiOperation({ summary: 'Generate presigned URL for file upload (Admin only)' })
  async generatePresignedUrl(@Body() dto: GenerateUploadUrlDto) {
    return this.uploadService.generatePresignedUrl(dto);
  }
}
