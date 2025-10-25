/**
 * EXAMPLE FILE - NOT FOR COMPILATION
 * 
 * This file demonstrates how to use QueryBuilderUtil in different services.
 * It contains example code patterns and is not meant to be imported or compiled.
 * 
 * Use these examples as a reference when implementing search functionality
 * in other services like classes-service, exams-service, etc.
 */

// Example: Using QueryBuilderUtil in a different service (e.g., Classes Service)

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { QueryBuilderUtil, SearchFilter } from 'src/shared/utils/query-builder.util';

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Example 1: Using buildGenericSearchQuery for classes
   */
  async searchClasses(filters: {
    text?: string;
    status?: string;
    category?: string;
    page: number;
    limit: number;
  }) {
    // Build the where clause using generic search
    const where = QueryBuilderUtil.buildGenericSearchQuery(
      filters,
      ['name', 'description'], // Fields to search with 'text' parameter
      ['status', 'category']   // Fields that need exact match
    );

    // Build pagination
    const paginationOptions = QueryBuilderUtil.buildPaginationOptions(
      filters.page,
      filters.limit
    );

    // Build sort options (optional)
    const orderBy = QueryBuilderUtil.buildSortOptions('created_at', 'desc');

    // Execute query
    const [classes, total] = await Promise.all([
      this.prisma.class.findMany({
        where,
        ...paginationOptions,
        orderBy,
      }),
      this.prisma.class.count({ where }),
    ]);

    return {
      data: classes,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  /**
   * Example 2: Custom search query builder for a specific model
   */
  static buildClassSearchQuery(filters: SearchFilter): any {
    const where: any = {};
    const conditions: any[] = [];

    // Text search in name and description
    if (filters.text && filters.text.trim()) {
      conditions.push({
        OR: [
          {
            name: {
              contains: filters.text.trim(),
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: filters.text.trim(),
              mode: 'insensitive',
            },
          },
        ],
      });
    }

    // Status filter
    if (filters.status) {
      conditions.push({
        status: filters.status.trim().toLowerCase(),
      });
    }

    // Category filter
    if (filters.category) {
      conditions.push({
        category: {
          equals: filters.category.trim(),
          mode: 'insensitive',
        },
      });
    }

    // Teacher filter (relationship)
    if (filters.teacherId) {
      conditions.push({
        teacher_id: parseInt(filters.teacherId),
      });
    }

    // Date range filter
    if (filters.startDate || filters.endDate) {
      const dateFilter: any = {};
      
      if (filters.startDate) {
        dateFilter.gte = new Date(filters.startDate);
      }
      
      if (filters.endDate) {
        dateFilter.lte = new Date(filters.endDate);
      }
      
      conditions.push({
        created_at: dateFilter,
      });
    }

    // Combine all conditions
    if (conditions.length > 0) {
      where.AND = conditions;
    }

    return where;
  }

  /**
   * Example 3: Using custom search query builder
   */
  async searchClassesWithCustomBuilder(filters: SearchFilter & {
    page: number;
    limit: number;
  }) {
    const where = ClassesService.buildClassSearchQuery(filters);
    const paginationOptions = QueryBuilderUtil.buildPaginationOptions(
      filters.page,
      filters.limit
    );

    const [classes, total] = await Promise.all([
      this.prisma.class.findMany({
        where,
        ...paginationOptions,
        include: {
          teacher: true,
          students: true,
        },
      }),
      this.prisma.class.count({ where }),
    ]);

    return {
      data: classes,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    };
  }
}

/**
 * Controller Example
 */
import { Controller, Get, Query } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @MessagePattern('classes.search')
  async searchClasses(@Payload() data: {
    page: number;
    limit: number;
    text?: string;
    status?: string;
    category?: string;
    teacherId?: string;
  }) {
    return await this.classesService.searchClasses(data);
  }
}

/**
 * API Gateway Controller Example
 */
import { Controller, Get, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Controller('classes')
export class ClassesGatewayController {
  constructor(
    @Inject('CLASSES_SERVICE') private readonly classesClient: ClientProxy
  ) {}

  @Get('search')
  async searchClasses(@Query() query: {
    page: number;
    limit: number;
    text?: string;
    status?: string;
    category?: string;
  }) {
    return this.classesClient
      .send('classes.search', query)
      .toPromise();
  }
}

/**
 * DTO Example for API Gateway
 */
export class ClassSearchDto extends PaginationDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  teacherId?: string;
}
