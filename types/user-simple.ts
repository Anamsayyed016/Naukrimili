export interface User {
  id?: number;
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserFormData {
  name: string;
  email: string;
}