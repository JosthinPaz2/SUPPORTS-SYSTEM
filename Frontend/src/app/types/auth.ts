export type UserRole = 'admin' | 'employee';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  id_role: number;
  campaign?: string;
  access_token?: string;
}