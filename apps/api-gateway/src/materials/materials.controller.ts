import {
  Controller,
  Post,
  Get,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  Body,
  Inject,
  BadRequestException,
  Res,
  ParseIntPipe,
  Query,
  NotFoundException,
  InternalServerErrorException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ClientProxy } from '@nestjs/microservices';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { SkipPermissionCheck } from '../common/decorators/skip-permission-check.decorator';

const unlinkAsync = promisify(fs.unlink);

interface RequestWithUser extends Request {
  user?: any;
}

// Multer storage configuration
const storage = diskStorage({
  destination: '/app/uploads/class-materials',
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
    callback(null, filename);
  },
});

@ApiTags('materials')
@ApiBearerAuth('JWT-auth')
@Controller('materials')
export class MaterialsController {
  constructor(
    @Inject('CLASSES_SERVICE') private readonly classesService: ClientProxy,
  ) {}

  @Get('class/:classId')
  @SkipPermissionCheck()
  @ApiOperation({
    summary: 'Get all materials for a class',
    description: 'Retrieve all materials (files) uploaded to a specific class',
  })
  @ApiParam({ name: 'classId', type: Number, description: 'Class ID' })
  @ApiResponse({ status: 200, description: 'Materials retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  async getMaterialsByClass(@Param('classId', ParseIntPipe) classId: number) {
    try {
      return await firstValueFrom(
        this.classesService.send('materials.all', classId),
      );
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch materials');
    }
  }

  @Post('upload')
  @SkipPermissionCheck()
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage,
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB per file
      },
      fileFilter: (req, file, callback) => {
        // Allow common file types
        const allowedMimes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'video/mp4',
          'video/webm',
          'application/zip',
          'application/x-rar-compressed',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(
              `File type ${file.mimetype} is not allowed`,
            ),
            false,
          );
        }
      },
    }),
  )
  @ApiOperation({
    summary: 'Upload materials to a class',
    description:
      'Upload one or multiple files as materials for a class. Supports documents, images, videos, and archives.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        classId: {
          type: 'number',
          description: 'Class ID',
        },
        title: {
          type: 'string',
          description: 'Optional title for the materials',
        },
        uploaderId: {
          type: 'number',
          description: 'ID of user uploading the files',
        },
        postId: {
          type: 'number',
          description: 'Optional post ID to attach materials to existing post',
        },
      },
      required: ['files', 'classId', 'uploaderId'],
    },
  })
  @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or file type' })
  async uploadMaterials(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('classId') classId: string,
    @Body('title') title: string,
    @Body('uploaderId') uploaderId: string,
    @Body('postId') postId?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    if (!classId || !uploaderId) {
      // Clean up uploaded files if validation fails
      await Promise.all(
        files.map((file) =>
          unlinkAsync(file.path).catch((err) =>
            console.error('Error deleting file:', err),
          ),
        ),
      );
      throw new BadRequestException('classId and uploaderId are required');
    }

    try {
      const classIdNum = parseInt(classId);
      const uploaderIdNum = parseInt(uploaderId);
      const postIdNum = postId ? parseInt(postId) : undefined;

      // Prepare material data
      const materials = files.map((file) => ({
        title: title || file.originalname,
        file_url: `/materials/download/${file.filename}`,
        file_name: file.originalname,
        file_path: file.path,
        file_size: file.size,
        mime_type: file.mimetype,
        uploaded_by: uploaderIdNum,
      }));

      // Send to classes service to save in database
      const result = await firstValueFrom(
        this.classesService.send('materials.create', {
          classId: classIdNum,
          materials,
          postId: postIdNum,
        }),
      );

      return {
        success: true,
        message: `${files.length} file(s) uploaded successfully`,
        data: result,
      };
    } catch (error) {
      // Clean up uploaded files on error
      await Promise.all(
        files.map((file) =>
          unlinkAsync(file.path).catch((err) =>
            console.error('Error deleting file:', err),
          ),
        ),
      );
      console.error('Error uploading materials:', error);
      throw new InternalServerErrorException('Failed to upload materials');
    }
  }

  @Get('download/:filename')
  @SkipPermissionCheck()
  @ApiOperation({
    summary: 'Download a material file',
    description: 'Download a specific material file by filename',
  })
  @ApiParam({ name: 'filename', type: String, description: 'File name' })
  @ApiResponse({ status: 200, description: 'File downloaded successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async downloadMaterial(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    try {
      const filePath = join('/app', 'uploads', 'class-materials', filename);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new NotFoundException('File not found');
      }

      // Get file stats for content-length
      const stat = fs.statSync(filePath);

      // Set headers
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Length', stat.size);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(filename)}"`,
      );

      // Stream file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error downloading file:', error);
      throw new InternalServerErrorException('Failed to download file');
    }
  }

  @Delete(':materialId')
  @SkipPermissionCheck()
  @ApiOperation({
    summary: 'Delete a material',
    description: 'Delete a material file and its database record',
  })
  @ApiParam({ name: 'materialId', type: Number, description: 'Material ID' })
  @ApiResponse({ status: 200, description: 'Material deleted successfully' })
  @ApiResponse({ status: 404, description: 'Material not found' })
  async deleteMaterial(@Param('materialId', ParseIntPipe) materialId: number) {
    try {
      // Get material info from database
      const material = await firstValueFrom(
        this.classesService.send('materials.findOne', materialId),
      );

      if (!material) {
        throw new NotFoundException('Material not found');
      }

      // Extract filename from URL
      const filename = material.file_url.split('/').pop();
      const filePath = join('/app', 'uploads', 'class-materials', filename);

      // Delete from database
      await firstValueFrom(
        this.classesService.send('materials.delete', materialId),
      );

      // Delete physical file
      if (fs.existsSync(filePath)) {
        await unlinkAsync(filePath);
      }

      return {
        success: true,
        message: 'Material deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error deleting material:', error);
      throw new InternalServerErrorException('Failed to delete material');
    }
  }
}
