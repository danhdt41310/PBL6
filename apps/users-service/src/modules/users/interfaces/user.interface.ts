// Define User interface based on Prisma schema
export interface User {
  user_id: number;
  full_name: string;
  email: string;
  password: string;
  role: 'admin' | 'user' | 'teacher';
  status: 'active' | 'blocked';
  created_at: Date;
  updated_at?: Date | null;
}