import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Inject,
  ParseIntPipe,
  ValidationPipe,
  UseGuards, // Giữ lại vì có thể cần cho AuthGuard
  HttpException, // Cần cho việc throw HttpException
  HttpStatus, // Cần cho việc throw HttpException
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, firstValueFrom, throwError, TimeoutError } from 'rxjs'; // Thêm throwError, TimeoutError
import { timeout, catchError } from 'rxjs/operators'; // Thêm timeout, catchError
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  CreateMessageDto,
  UpdateMessageDto,
  PaginationQueryDto,
} from '../dto/message.dto';
import {
  CreateConversationDto,
  PaginationQueryDto as ConversationPaginationDto,
} from '../dto/conversation.dto';
import { ChatsGateway } from './chats.gateway';

const unlinkAsync = promisify(fs.unlink);

// Multer storage configuration for chat files
const chatFileStorage = diskStorage({
  destination: '/app/uploads/chat-files',
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    const filename = `chat-${uniqueSuffix}${ext}`;
    callback(null, filename);
  },
});

@ApiTags('chats')
@ApiBearerAuth('JWT-auth')
@Controller('chats')
export class ChatsController {
  constructor(
    @Inject('CHATS_SERVICE') private chatsService: ClientProxy,
    @Inject('USERS_SERVICE') private usersService: ClientProxy,
    private chatsGateway: ChatsGateway,
  ) {}

  // ==================== Test Endpoints ====================

  @Get('hello')
  @ApiOperation({
    summary: 'Test chats service',
    description: 'Simple hello endpoint for testing chats service',
  })
  @ApiResponse({ status: 200, description: 'Returns hello message' })
  getHello(): Observable<string> {
    // Observable không cần xử lý Promise/firstValueFrom
    return this.chatsService.send('chats.get_hello', {});
  }

  // ==================== Message Endpoints ====================

  @Post('messages')
  @ApiOperation({
    summary: 'Create a new message',
    description: 'Create a new message in a conversation',
  })
  @ApiResponse({ status: 201, description: 'Message created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async createMessage(
    @Body(ValidationPipe) createMessageDto: CreateMessageDto,
  ) {
    try {
      return await firstValueFrom(
        // Sử dụng firstValueFrom
        this.chatsService.send('messages.create', createMessageDto).pipe(
          timeout(5000),
          catchError((err) => {
            if (err instanceof TimeoutError) {
              return throwError(
                () =>
                  new HttpException(
                    'Request timed out',
                    HttpStatus.REQUEST_TIMEOUT,
                  ),
              );
            }
            // Có thể cần thêm logic kiểm tra lỗi cụ thể từ Microservice
            return throwError(
              () =>
                new HttpException(
                  'Failed to create message',
                  HttpStatus.INTERNAL_SERVER_ERROR,
                ),
            );
          }),
        ),
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to create message',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('messages/:id')
  @ApiOperation({
    summary: 'Get a message by ID',
    description: 'Retrieve a single message by its ID',
  })
  @ApiParam({ name: 'id', description: 'Message ID', type: Number })
  @ApiResponse({ status: 200, description: 'Message found' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async getMessage(@Param('id', ParseIntPipe) id: number) {
    console.log('🔍 getMessage called with ID:', id);
    try {
      return await firstValueFrom(
        // Sử dụng firstValueFrom
        this.chatsService.send('messages.find_one', { id }).pipe(
          timeout(5000),
          catchError((err) => {
            // Giả định Microservice trả về lỗi nếu không tìm thấy, nếu không, cần kiểm tra kết quả null
            return throwError(
              () =>
                new HttpException('Message not found', HttpStatus.NOT_FOUND),
            );
          }),
        ),
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch message',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({
    summary: 'Get messages in a conversation',
    description: 'Retrieve all messages in a conversation with pagination',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'Conversation ID',
    type: Number,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
    example: 20,
  })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async getConversationMessages(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Query(new ValidationPipe({ transform: true }))
    pagination: PaginationQueryDto,
  ) {
    try {
      return await firstValueFrom(
        // Sử dụng firstValueFrom
        this.chatsService
          .send('messages.find_by_conversation', {
            conversationId,
            pagination,
          })
          .pipe(
            timeout(5000),
            catchError((err) => {
              if (err instanceof TimeoutError) {
                return throwError(
                  () =>
                    new HttpException(
                      'Request timed out',
                      HttpStatus.REQUEST_TIMEOUT,
                    ),
                );
              }
              return throwError(
                () =>
                  new HttpException(
                    'Failed to fetch messages',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                  ),
              );
            }),
          ),
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch conversation messages',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('messages/:id')
  @ApiOperation({
    summary: 'Update a message',
    description: 'Update message content or type',
  })
  @ApiParam({ name: 'id', description: 'Message ID', type: Number })
  @ApiResponse({ status: 200, description: 'Message updated successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async updateMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateMessageDto: UpdateMessageDto,
  ) {
    try {
      return await firstValueFrom(
        // Sử dụng firstValueFrom
        this.chatsService
          .send('messages.update', { id, data: updateMessageDto })
          .pipe(
            timeout(5000),
            catchError((err) => {
              // Thay vì BAD_REQUEST, có thể cần 404 nếu message không tồn tại
              return throwError(
                () =>
                  new HttpException(
                    'Failed to update message',
                    HttpStatus.BAD_REQUEST,
                  ),
              );
            }),
          ),
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update message',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('messages/:id')
  @ApiOperation({
    summary: 'Delete a message',
    description: 'Delete a message by ID',
  })
  @ApiParam({ name: 'id', description: 'Message ID', type: Number })
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async deleteMessage(@Param('id', ParseIntPipe) id: number) {
    try {
      return await firstValueFrom(
        // Sử dụng firstValueFrom
        this.chatsService.send('messages.delete', { id }).pipe(
          timeout(5000),
          catchError((err) => {
            // Thay vì BAD_REQUEST, có thể cần 404 nếu message không tồn tại
            return throwError(
              () =>
                new HttpException(
                  'Failed to delete message',
                  HttpStatus.BAD_REQUEST,
                ),
            );
          }),
        ),
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to delete message',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('conversations/:conversationId/mark-as-read')
  @ApiOperation({
    summary: 'Mark messages as read',
    description: 'Mark messages in a conversation as read for a specific user',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'Conversation ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Messages marked as read successfully',
  })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async markMessagesAsRead(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Body() body: { user_id: number; message_ids?: number[] },
  ) {
    try {
      const result = await firstValueFrom(
        this.chatsService
          .send('messages.mark_as_read', {
            conversation_id: conversationId,
            user_id: body.user_id,
            message_ids: body.message_ids,
          })
          .pipe(
            timeout(5000),
            catchError((err) => {
              if (err instanceof TimeoutError) {
                return throwError(
                  () =>
                    new HttpException(
                      'Request timed out',
                      HttpStatus.REQUEST_TIMEOUT,
                    ),
                );
              }
              return throwError(
                () =>
                  new HttpException(
                    'Failed to mark messages as read',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                  ),
              );
            }),
          ),
      );

      // Emit socket event to notify clients about read status update
      this.chatsGateway.server
        .to(`conversation:${conversationId}`)
        .emit('messages:read', {
          conversation_id: conversationId,
          user_id: body.user_id,
          count: result.count || 0,
        });

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to mark messages as read',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('users/:userId/unread-count')
  @ApiOperation({
    summary: 'Get total unread message count',
    description:
      'Get total number of unread messages for a user across all conversations',
  })
  @ApiParam({ name: 'userId', description: 'User ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
  })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async getUnreadCount(@Param('userId', ParseIntPipe) userId: number) {
    console.log('📊 Get unread count for user:', userId);
    try {
      const result = await firstValueFrom(
        this.chatsService.send('messages.get_unread_count', { userId }).pipe(
          timeout(5000),
          catchError((err) => {
            if (err instanceof TimeoutError) {
              return throwError(
                () =>
                  new HttpException(
                    'Request timed out',
                    HttpStatus.REQUEST_TIMEOUT,
                  ),
              );
            }
            return throwError(
              () =>
                new HttpException(
                  'Failed to get unread count',
                  HttpStatus.INTERNAL_SERVER_ERROR,
                ),
            );
          }),
        ),
      );

      console.log('📊 Unread count result:', result);

      // Format response to match frontend expectation
      return {
        success: true,
        data: result.count || 0,
        message: 'Unread count retrieved successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to get unread count',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('users/:userId/unread-by-conversation')
  @ApiOperation({
    summary: 'Get unread count per conversation',
    description: 'Get unread message counts grouped by conversation for a user',
  })
  @ApiParam({ name: 'userId', description: 'User ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Unread counts retrieved successfully',
  })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async getUnreadByConversation(@Param('userId', ParseIntPipe) userId: number) {
    console.log('📊 Get unread by conversation for user:', userId);
    try {
      const result = await firstValueFrom(
        this.chatsService
          .send('messages.get_unread_by_conversation', { userId })
          .pipe(
            timeout(5000),
            catchError((err) => {
              if (err instanceof TimeoutError) {
                return throwError(
                  () =>
                    new HttpException(
                      'Request timed out',
                      HttpStatus.REQUEST_TIMEOUT,
                    ),
                );
              }
              return throwError(
                () =>
                  new HttpException(
                    'Failed to get unread by conversation',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                  ),
              );
            }),
          ),
      );

      console.log('📊 Unread by conversation result:', result);

      // Format response to match frontend expectation
      return {
        success: true,
        data: result,
        message: 'Unread counts retrieved successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to get unread by conversation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== Conversation Endpoints ====================

  // Endpoint bị lồng đã được tách ra và sửa
  @Post('conversations')
  @ApiOperation({
    summary: 'Create a new conversation',
    description:
      'Create a new conversation between two users. Returns existing if already exists.',
  })
  @ApiResponse({
    status: 201,
    description: 'Conversation created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or self-conversation',
  })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async createConversation(
    @Body(ValidationPipe) createConversationDto: CreateConversationDto,
  ) {
    console.log(
      '📝 Create conversation request received:',
      createConversationDto,
    );
    console.log(
      'sender_id type:',
      typeof createConversationDto.sender_id,
      'value:',
      createConversationDto.sender_id,
    );
    console.log(
      'receiver_id type:',
      typeof createConversationDto.receiver_id,
      'value:',
      createConversationDto.receiver_id,
    );

    try {
      return await firstValueFrom(
        // Sử dụng firstValueFrom
        this.chatsService
          .send('conversations.create', createConversationDto)
          .pipe(
            timeout(5000),
            catchError((err) => {
              if (err instanceof TimeoutError) {
                return throwError(
                  () =>
                    new HttpException(
                      'Request timed out',
                      HttpStatus.REQUEST_TIMEOUT,
                    ),
                );
              }
              return throwError(
                () =>
                  new HttpException(
                    'Failed to create conversation',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                  ),
              );
            }),
          ),
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to create conversation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Endpoint bị lồng đã được tách ra và sửa
  @Get('conversations/:id')
  @ApiOperation({
    summary: 'Get a conversation by ID',
    description: 'Retrieve a conversation with optional messages',
  })
  @ApiParam({ name: 'id', description: 'Conversation ID', type: Number })
  @ApiQuery({
    name: 'includeMessages',
    required: false,
    type: Boolean,
    description: 'Include all messages in response',
    example: false,
  })
  @ApiResponse({ status: 200, description: 'Conversation found' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getConversation(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeMessages') includeMessages?: boolean,
  ) {
    // Không cần try/catch phức tạp nếu không xử lý timeout hay lỗi đặc biệt
    // Microservice thường trả về lỗi (hoặc null) nếu không tìm thấy
    return await firstValueFrom(
      this.chatsService.send('conversations.find_one', {
        id,
        includeMessages: includeMessages === true,
      }),
    );
  }

  // Endpoint bị lồng đã được tách ra và sửa
  @Get('users/:userId/conversations')
  @ApiOperation({
    summary: 'Get all conversations for a user',
    description:
      'Retrieve all conversations for a specific user with pagination and user info',
  })
  @ApiParam({ name: 'userId', description: 'User ID', type: Number })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Conversations retrieved successfully',
  })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async getUserConversations(
    @Param('userId', ParseIntPipe) userId: number,
    @Query(new ValidationPipe({ transform: true }))
    pagination: ConversationPaginationDto,
  ) {
    try {
      // Get conversations from chats service
      const conversationsResponse: any = await firstValueFrom(
        this.chatsService
          .send('conversations.find_by_user', { userId, pagination })
          .pipe(
            timeout(5000),
            catchError((err) => {
              if (err instanceof TimeoutError) {
                return throwError(
                  () =>
                    new HttpException(
                      'Request timed out',
                      HttpStatus.REQUEST_TIMEOUT,
                    ),
                );
              }
              return throwError(
                () =>
                  new HttpException(
                    'Failed to fetch conversations',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                  ),
              );
            }),
          ),
      );

      // Extract conversations array
      const conversations =
        conversationsResponse?.data?.conversations ||
        conversationsResponse?.conversations ||
        [];

      if (conversations.length === 0) {
        return conversationsResponse;
      }

      // Get unique user IDs from conversations
      const userIds = [
        ...new Set(
          conversations.map((conv: any): number => Number(conv.receiver_id)),
        ),
      ].filter((id: number) => !isNaN(id));

      // Fetch user info in batch
      let usersMap: any = {};
      if (userIds.length > 0) {
        try {
          const usersResponse: any = await firstValueFrom(
            this.usersService
              .send('users.get_list_profile_by_ids', { userIds })
              .pipe(
                timeout(3000),
                catchError(() => throwError(() => [])),
              ),
          );

          console.log('📝 Users response:', usersResponse);
          const users =
            usersResponse?.users || usersResponse?.data?.users || [];
          console.log('📝 Extracted users:', users);
          usersMap = users.reduce((acc: any, user: any) => {
            acc[user.user_id] = user;
            return acc;
          }, {});
          console.log('📝 Users map:', usersMap);
        } catch (err) {
          console.error('Failed to fetch user info:', err.message);
        }
      }

      // Populate user info into conversations
      const populatedConversations = conversations.map((conv: any) => {
        const receiverInfo = usersMap[conv.receiver_id];
        return {
          ...conv,
          receiver_name:
            receiverInfo?.full_name ||
            receiverInfo?.email ||
            `User #${conv.receiver_id}`,
          receiver_avatar: receiverInfo?.avatar || null,
        };
      });

      // Return with populated data
      if (conversationsResponse?.data) {
        return {
          ...conversationsResponse,
          data: {
            ...conversationsResponse.data,
            conversations: populatedConversations,
          },
        };
      }

      return {
        ...conversationsResponse,
        conversations: populatedConversations,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch user conversations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Endpoint bị lồng đã được tách ra và sửa
  @Get('conversations/between/:userId1/:userId2')
  @ApiOperation({
    summary: 'Find conversation between two users',
    description: 'Find existing conversation between two specific users',
  })
  @ApiParam({ name: 'userId1', description: 'First user ID', type: Number })
  @ApiParam({ name: 'userId2', description: 'Second user ID', type: Number })
  @ApiResponse({ status: 200, description: 'Conversation found or null' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async getConversationByUsers(
    @Param('userId1', ParseIntPipe) userId1: number,
    @Param('userId2', ParseIntPipe) userId2: number,
  ) {
    try {
      return await firstValueFrom(
        // Sử dụng firstValueFrom
        this.chatsService
          .send('conversations.find_by_users', { userId1, userId2 })
          .pipe(
            timeout(5000),
            catchError((err) => {
              if (err instanceof TimeoutError) {
                return throwError(
                  () =>
                    new HttpException(
                      'Request timed out',
                      HttpStatus.REQUEST_TIMEOUT,
                    ),
                );
              }
              return throwError(
                () =>
                  new HttpException(
                    'Failed to find conversation',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                  ),
              );
            }),
          ),
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to find conversation between users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Endpoint bị lồng đã được tách ra và sửa
  @Delete('conversations/:id')
  @ApiOperation({
    summary: 'Delete a conversation',
    description: 'Delete a conversation and all its messages (cascade)',
  })
  @ApiParam({ name: 'id', description: 'Conversation ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Conversation deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async deleteConversation(@Param('id', ParseIntPipe) id: number) {
    try {
      return await firstValueFrom(
        // Sử dụng firstValueFrom
        this.chatsService.send('conversations.delete', { id }).pipe(
          timeout(5000),
          catchError((err) => {
            // Thay vì BAD_REQUEST, có thể cần 404 nếu conversation không tồn tại
            return throwError(
              () =>
                new HttpException(
                  'Failed to delete conversation',
                  HttpStatus.BAD_REQUEST,
                ),
            );
          }),
        ),
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to delete conversation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== File Upload Endpoints ====================

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: chatFileStorage,
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
      fileFilter: (req, file, callback) => {
        // Allow common file types
        const allowedMimes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'video/mp4',
          'video/webm',
          'application/zip',
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
    summary: 'Upload file for chat',
    description: 'Upload a file to be sent in chat message',
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type' })
  async uploadChatFile(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return {
      success: true,
      file_url: `/chats/download/${file.filename}`,
      file_name: file.originalname,
      file_size: file.size,
      mime_type: file.mimetype,
    };
  }

  @Get('download/:filename')
  @ApiOperation({
    summary: 'Download chat file',
    description: 'Download a file from chat messages',
  })
  @ApiResponse({ status: 200, description: 'File downloaded successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async downloadChatFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    try {
      console.log('📥 Download request for file:', filename);

      const filePath = join('/app', 'uploads', 'chat-files', filename);
      console.log('📥 Full path:', filePath);

      if (!fs.existsSync(filePath)) {
        console.error('❌ File not found:', filePath);
        throw new HttpException('File not found', HttpStatus.NOT_FOUND);
      }

      const stat = fs.statSync(filePath);
      console.log('✅ File found, size:', stat.size);

      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Length', stat.size);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(filename)}"`,
      );

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      console.log('✅ File stream sent');
    } catch (error) {
      console.error('❌ Download error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to download file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
