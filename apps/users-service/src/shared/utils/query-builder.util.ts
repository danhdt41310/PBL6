import { Prisma } from '@prisma/users-client';

export interface SearchFilter {
  text?: string;
  role?: string;
  status?: string;
  gender?: string;
  birthday?: string;
  [key: string]: any;
}

export class QueryBuilderUtil {
  /**
   * Build a Prisma where clause for user search with multiple filters
   * @param filters - The search filters to apply
   * @returns Prisma where clause object
   */
  static buildUserSearchQuery(filters: SearchFilter): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};
    const conditions: any[] = [];

    // Text search in email and full_name
    if (filters.text && filters.text.trim()) {
      conditions.push({
        OR: [
          {
            email: {
              contains: filters.text.trim(),
              mode: 'insensitive' as Prisma.QueryMode,
            },
          },
          {
            full_name: {
              contains: filters.text.trim(),
              mode: 'insensitive' as Prisma.QueryMode,
            },
          },
        ],
      });
    }

    // Status filter
    if (filters.status && filters.status.trim()) {
      conditions.push({
        status: filters.status.trim().toLowerCase(),
      });
    }

    // Gender filter
    if (filters.gender && filters.gender.trim()) {
      conditions.push({
        gender: {
          equals: filters.gender.trim(),
          mode: 'insensitive' as Prisma.QueryMode,
        },
      });
    }

    // Birthday filter (exact date match)
    if (filters.birthday && filters.birthday.trim()) {
      try {
        const birthdayDate = new Date(filters.birthday.trim());
        // Check if date is valid
        if (!isNaN(birthdayDate.getTime())) {
          // Create date range for the entire day
          const startOfDay = new Date(birthdayDate);
          startOfDay.setHours(0, 0, 0, 0);
          
          const endOfDay = new Date(birthdayDate);
          endOfDay.setHours(23, 59, 59, 999);

          conditions.push({
            dateOfBirth: {
              gte: startOfDay,
              lte: endOfDay,
            },
          });
        }
      } catch (error) {
        // Invalid date format, skip this filter
        console.warn('Invalid birthday format:', filters.birthday);
      }
    }

    // Role filter - need to join with userRoles table
    if (filters.role && filters.role.trim()) {
      conditions.push({
        userRoles: {
          some: {
            role: {
              name: {
                equals: filters.role.trim(),
                mode: 'insensitive' as Prisma.QueryMode,
              },
            },
          },
        },
      });
    }

    // Combine all conditions with AND
    if (conditions.length > 0) {
      where.AND = conditions;
    }

    return where;
  }

  /**
   * Generic method to build search queries for other entities
   * Can be extended for other models in the future
   */
  static buildGenericSearchQuery(
    filters: Record<string, any>,
    searchableFields: string[],
    exactMatchFields: string[] = [],
  ): any {
    const where: any = {};
    const conditions: any[] = [];

    // Handle text search across multiple fields
    if (filters.text && filters.text.trim()) {
      const textConditions = searchableFields.map((field) => ({
        [field]: {
          contains: filters.text.trim(),
          mode: 'insensitive',
        },
      }));

      if (textConditions.length > 0) {
        conditions.push({
          OR: textConditions,
        });
      }
    }

    // Handle exact match fields
    exactMatchFields.forEach((field) => {
      if (filters[field] !== undefined && filters[field] !== null) {
        const value = typeof filters[field] === 'string' ? filters[field].trim() : filters[field];
        if (value !== '') {
          conditions.push({
            [field]: {
              equals: value,
              mode: typeof value === 'string' ? 'insensitive' : undefined,
            },
          });
        }
      }
    });

    // Combine all conditions with AND
    if (conditions.length > 0) {
      where.AND = conditions;
    }

    return where;
  }

  /**
   * Build pagination options for Prisma
   */
  static buildPaginationOptions(page: number, limit: number) {
    return {
      skip: (page - 1) * limit,
      take: limit,
    };
  }

  /**
   * Build sorting options for Prisma
   */
  static buildSortOptions(sortBy?: string, sortOrder: 'asc' | 'desc' = 'asc') {
    if (!sortBy) {
      return { created_at: 'desc' }; // Default sort
    }

    return {
      [sortBy]: sortOrder,
    };
  }
}
