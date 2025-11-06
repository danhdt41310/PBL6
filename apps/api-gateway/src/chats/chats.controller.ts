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
} from '@nestjs/common';
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
import { CreateMessageDto, UpdateMessageDto, PaginationQueryDto } from '../dto/message.dto';
import { CreateConversationDto, PaginationQueryDto as ConversationPaginationDto } from '../dto/conversation.dto';

@ApiTags('chats')
@ApiBearerAuth('JWT-auth')
@Controller('chats')
export class ChatsController {
  constructor(@Inject('CHATS_SERVICE') private chatsService: ClientProxy) { }

  // ==================== Test Endpoints ====================

  @Get('hello')
  @ApiOperation({ summary: 'Test chats service', description: 'Simple hello endpoint for testing chats service' })
  @ApiResponse({ status: 200, description: 'Returns hello message' })
  getHello(): Observable<string> {
    // Observable không cần xử lý Promise/firstValueFrom
    return this.chatsService.send('chats.get_hello', {});
  }

  // ==================== Message Endpoints ====================

  @Post('messages')
  @ApiOperation({ summary: 'Create a new message', description: 'Create a new message in a conversation' })
  @ApiResponse({ status: 201, description: 'Message created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async createMessage(@Body(ValidationPipe) createMessageDto: CreateMessageDto) {
    try {
      console.log('Creating message with data:', createMessageDto);
      return await firstValueFrom( // Sử dụng firstValueFrom
        this.chatsService
          .send('messages.create', createMessageDto)
          .pipe(
            timeout(5000),
            catchError(err => {
              if (err instanceof TimeoutError) {
                return throwError(() => new HttpException('Request timed out', HttpStatus.REQUEST_TIMEOUT));
              }
              // Có thể cần thêm logic kiểm tra lỗi cụ thể từ Microservice
              return throwError(() => new HttpException('Failed to create message', HttpStatus.INTERNAL_SERVER_ERROR));
            }),
          )
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to create message', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('messages/:id')
  @ApiOperation({ summary: 'Get a message by ID', description: 'Retrieve a single message by its ID' })
  @ApiParam({ name: 'id', description: 'Message ID', type: Number })
  @ApiResponse({ status: 200, description: 'Message found' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async getMessage(@Param('id', ParseIntPipe) id: number) {
    try {
      return await firstValueFrom( // Sử dụng firstValueFrom
        this.chatsService
          .send('messages.find_one', { id })
          .pipe(
            timeout(5000),
            catchError(err => {
              // Giả định Microservice trả về lỗi nếu không tìm thấy, nếu không, cần kiểm tra kết quả null
              return throwError(() => new HttpException('Message not found', HttpStatus.NOT_FOUND));
            }),
          )
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to fetch message', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({
    summary: 'Get messages in a conversation',
    description: 'Retrieve all messages in a conversation with pagination'
  })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID', type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 20 })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async getConversationMessages(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Query(new ValidationPipe({ transform: true })) pagination: PaginationQueryDto,
  ) {
    try {
      return await firstValueFrom( // Sử dụng firstValueFrom
        this.chatsService
          .send('messages.find_by_conversation', {
            conversationId,
            pagination,
          })
          .pipe(
            timeout(5000),
            catchError(err => {
              if (err instanceof TimeoutError) {
                return throwError(() => new HttpException('Request timed out', HttpStatus.REQUEST_TIMEOUT));
              }
              return throwError(() => new HttpException('Failed to fetch messages', HttpStatus.INTERNAL_SERVER_ERROR));
            }),
          )
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to fetch conversation messages', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Endpoint bị lồng đã được tách ra và sửa
  @Get('users/:userId/messages')
  @ApiOperation({
    summary: 'Get all messages for a user',
    description: 'Retrieve all messages for a specific user with pagination'
  })
  @ApiParam({ name: 'userId', description: 'User ID', type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 20 })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async getUserMessages(
    @Param('userId', ParseIntPipe) userId: number,
    @Query(new ValidationPipe({ transform: true })) pagination: PaginationQueryDto,
  ) {
    try {
      return await firstValueFrom( // Sử dụng firstValueFrom
        this.chatsService
          .send('messages.find_by_user', {
            userId,
            pagination,
          })
          .pipe(
            timeout(5000),
            catchError(err => {
              if (err instanceof TimeoutError) {
                return throwError(() => new HttpException('Request timed out', HttpStatus.REQUEST_TIMEOUT));
              }
              return throwError(() => new HttpException('Failed to fetch user messages', HttpStatus.INTERNAL_SERVER_ERROR));
            }),
          )
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to fetch user messages', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put('messages/:id')
  @ApiOperation({ summary: 'Update a message', description: 'Update message content or type' })
  @ApiParam({ name: 'id', description: 'Message ID', type: Number })
  @ApiResponse({ status: 200, description: 'Message updated successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async updateMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateMessageDto: UpdateMessageDto,
  ) {
    try {
      return await firstValueFrom( // Sử dụng firstValueFrom
        this.chatsService
          .send('messages.update', { id, data: updateMessageDto })
          .pipe(
            timeout(5000),
            catchError(err => {
              // Thay vì BAD_REQUEST, có thể cần 404 nếu message không tồn tại
              return throwError(() => new HttpException('Failed to update message', HttpStatus.BAD_REQUEST));
            }),
          )
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to update message', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete('messages/:id')
  @ApiOperation({ summary: 'Delete a message', description: 'Delete a message by ID' })
  @ApiParam({ name: 'id', description: 'Message ID', type: Number })
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async deleteMessage(@Param('id', ParseIntPipe) id: number) {
    try {
      return await firstValueFrom( // Sử dụng firstValueFrom
        this.chatsService
          .send('messages.delete', { id })
          .pipe(
            timeout(5000),
            catchError(err => {
              // Thay vì BAD_REQUEST, có thể cần 404 nếu message không tồn tại
              return throwError(() => new HttpException('Failed to delete message', HttpStatus.BAD_REQUEST));
            }),
          )
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to delete message', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ==================== Conversation Endpoints ====================

  // Endpoint bị lồng đã được tách ra và sửa
  @Post('conversations')
  @ApiOperation({
    summary: 'Create a new conversation',
    description: 'Create a new conversation between two users. Returns existing if already exists.'
  })
  @ApiResponse({ status: 201, description: 'Conversation created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or self-conversation' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async createConversation(@Body(ValidationPipe) createConversationDto: CreateConversationDto) {
    try {
      return await firstValueFrom( // Sử dụng firstValueFrom
        this.chatsService
          .send('conversations.create', createConversationDto)
          .pipe(
            timeout(5000),
            catchError(err => {
              if (err instanceof TimeoutError) {
                return throwError(() => new HttpException('Request timed out', HttpStatus.REQUEST_TIMEOUT));
              }
              return throwError(() => new HttpException('Failed to create conversation', HttpStatus.INTERNAL_SERVER_ERROR));
            }),
          )
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to create conversation', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Endpoint bị lồng đã được tách ra và sửa
  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get a conversation by ID', description: 'Retrieve a conversation with optional messages' })
  @ApiParam({ name: 'id', description: 'Conversation ID', type: Number })
  @ApiQuery({
    name: 'includeMessages',
    required: false,
    type: Boolean,
    description: 'Include all messages in response',
    example: false
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
        includeMessages: includeMessages === true
      })
    );
  }

  // Endpoint bị lồng đã được tách ra và sửa
  @Get('users/:userId/conversations')
  @ApiOperation({
    summary: 'Get all conversations for a user',
    description: 'Retrieve all conversations for a specific user with pagination'
  })
  @ApiParam({ name: 'userId', description: 'User ID', type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 20 })
  @ApiResponse({ status: 200, description: 'Conversations retrieved successfully' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async getUserConversations(
    @Param('userId', ParseIntPipe) userId: number,
    @Query(new ValidationPipe({ transform: true })) pagination: ConversationPaginationDto,
  ) {
    try {
      return await firstValueFrom( // Sử dụng firstValueFrom
        this.chatsService
          .send('conversations.find_by_user', {
            userId,
            pagination,
          })
          .pipe(
            timeout(5000),
            catchError(err => {
              if (err instanceof TimeoutError) {
                return throwError(() => new HttpException('Request timed out', HttpStatus.REQUEST_TIMEOUT));
              }
              return throwError(() => new HttpException('Failed to fetch conversations', HttpStatus.INTERNAL_SERVER_ERROR));
            }),
          )
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to fetch user conversations', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Endpoint bị lồng đã được tách ra và sửa
  @Get('conversations/between/:userId1/:userId2')
  @ApiOperation({
    summary: 'Find conversation between two users',
    description: 'Find existing conversation between two specific users'
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
      return await firstValueFrom( // Sử dụng firstValueFrom
        this.chatsService
          .send('conversations.find_by_users', { userId1, userId2 })
          .pipe(
            timeout(5000),
            catchError(err => {
              if (err instanceof TimeoutError) {
                return throwError(() => new HttpException('Request timed out', HttpStatus.REQUEST_TIMEOUT));
              }
              return throwError(() => new HttpException('Failed to find conversation', HttpStatus.INTERNAL_SERVER_ERROR));
            }),
          )
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to find conversation between users', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Endpoint bị lồng đã được tách ra và sửa
  @Delete('conversations/:id')
  @ApiOperation({
    summary: 'Delete a conversation',
    description: 'Delete a conversation and all its messages (cascade)'
  })
  @ApiParam({ name: 'id', description: 'Conversation ID', type: Number })
  @ApiResponse({ status: 200, description: 'Conversation deleted successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async deleteConversation(@Param('id', ParseIntPipe) id: number) {
    try {
      return await firstValueFrom( // Sử dụng firstValueFrom
        this.chatsService
          .send('conversations.delete', { id })
          .pipe(
            timeout(5000),
            catchError(err => {
              // Thay vì BAD_REQUEST, có thể cần 404 nếu conversation không tồn tại
              return throwError(() => new HttpException('Failed to delete conversation', HttpStatus.BAD_REQUEST));
            }),
          )
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to delete conversation', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Endpoint bị lồng đã được tách ra và sửa
  @Get('users/:userId/conversations/stats')
  @ApiOperation({
    summary: 'Get conversation statistics',
    description: 'Get statistics about user conversations and messages'
  })
  @ApiParam({ name: 'userId', description: 'User ID', type: Number })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async getUserConversationStats(@Param('userId', ParseIntPipe) userId: number) {
    try {
      return await firstValueFrom( // Sử dụng firstValueFrom
        this.chatsService
          .send('conversations.stats', { userId })
          .pipe(
            timeout(5000),
            catchError(err => {
              if (err instanceof TimeoutError) {
                return throwError(() => new HttpException('Request timed out', HttpStatus.REQUEST_TIMEOUT));
              }
              return throwError(() => new HttpException('Failed to fetch statistics', HttpStatus.INTERNAL_SERVER_ERROR));
            }),
          )
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to fetch conversation statistics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}