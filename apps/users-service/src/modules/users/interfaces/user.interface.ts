// Define User interface based on Prisma schema
export interface User {
  user_id: number;
  full_name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  bio?: string;
  date_of_birth?: Date;
  gender?: string;
  avatar?: string;
  role?: string;
  status: 'active' | 'blocked';
  created_at: Date;
  updated_at?: Date | null;
}