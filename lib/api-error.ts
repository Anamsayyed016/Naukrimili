import axios from 'axios';

export class APIError extends Error {
  public status: number;
  public code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
  }
}

export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError;
}

export function handleAPIError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status || 500;
    const data: any = error.response?.data || {};
    const message = data.message || data.error || error.message || 'Request failed';
    const code = data.code;
    throw new APIError(message, status, code);
  }
  if (error instanceof Error) {
    throw new APIError(error.message, 500);
  }
  throw new APIError('An unknown error occurred', 500);
}
