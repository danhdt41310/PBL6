import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Inject,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AUDIT_LOG_PATTERNS } from '@repo/common';
import { timeout, catchError } from 'rxjs/operators';
import { throwError, TimeoutError, firstValueFrom } from 'rxjs';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { SkipPermissionCheck } from '../common/decorators/skip-permission-check.decorator';

@ApiTags('Audit Logs')
@ApiBearerAuth('JWT-auth')
@Controller('audit-logs')
export class AuditLogsController {
  constructor(
    @Inject('USERS_SERVICE') private readonly usersClient: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all audit logs',
    description: 'Retrieve a paginated list of audit logs with optional filters (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
  })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getLogs(@Query() query: AuditLogQueryDto) {
    try {
      return await firstValueFrom(
        this.usersClient.send(AUDIT_LOG_PATTERNS.GET_LOGS, query).pipe(
          timeout(10000),
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
                  'Failed to fetch audit logs',
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
        'Failed to fetch audit logs',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('export')
  @ApiOperation({
    summary: 'Export audit logs',
    description: 'Export audit logs with filters (Admin only). Limited to 10,000 rows.',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit logs exported successfully',
  })
  async exportLogs(@Query() query: AuditLogQueryDto) {
    try {
      return await firstValueFrom(
        this.usersClient.send(AUDIT_LOG_PATTERNS.EXPORT_LOGS, query).pipe(
          timeout(30000), // Longer timeout for export
          catchError((err) => {
            if (err instanceof TimeoutError) {
              return throwError(
                () =>
                  new HttpException(
                    'Export request timed out',
                    HttpStatus.REQUEST_TIMEOUT,
                  ),
              );
            }
            return throwError(
              () =>
                new HttpException(
                  'Failed to export audit logs',
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
        'Failed to export audit logs',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get user activity history',
    description: 'Get audit logs for a specific user (Admin only)',
  })
  @ApiParam({ name: 'userId', type: Number, description: 'User ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of logs to return',
  })
  @ApiResponse({
    status: 200,
    description: 'User activity retrieved successfully',
  })
  async getUserActivity(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('limit') limit?: string,
  ) {
    try {
      return await firstValueFrom(
        this.usersClient
          .send(AUDIT_LOG_PATTERNS.GET_USER_ACTIVITY, {
            userId,
            limit: limit ? parseInt(limit, 10) : undefined,
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
                    'Failed to fetch user activity',
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
        'Failed to fetch user activity',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get audit log by ID',
    description: 'Retrieve a specific audit log by its ID (Admin only)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Audit log ID' })
  @ApiResponse({
    status: 200,
    description: 'Audit log retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  async getLogById(@Param('id', ParseIntPipe) id: number) {
    try {
      return await firstValueFrom(
        this.usersClient
          .send(AUDIT_LOG_PATTERNS.GET_LOG_BY_ID, { logId: id })
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
                    'Audit log not found',
                    HttpStatus.NOT_FOUND,
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
        'Failed to fetch audit log',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
