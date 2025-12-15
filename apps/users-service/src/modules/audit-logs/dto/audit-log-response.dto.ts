import { AuditLogResource } from '@prisma/users-client';

export interface AuditLogResponseDto {
  log_id: number;
  action: string;
  resource: AuditLogResource;
  description?: string;
  actor_id: number;
  actor_email: string;
  actor_name: string;
  target_id?: string;
  target_type?: string;
  old_data?: any;
  new_data?: any;
  changes?: any;
  ip_address?: string;
  user_agent?: string;
  request_method?: string;
  request_path?: string;
  metadata?: any;
  created_at: Date;
  actor?: {
    user_id: number;
    full_name: string;
    email: string;
    avatar?: string;
  };
}

export interface AuditLogListResponseDto {
  data: AuditLogResponseDto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
