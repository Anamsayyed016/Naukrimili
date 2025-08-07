import axios from 'axios';

export class APIError extends Error {
  ;
  constructor(;
    message: string;
    public status: number;
    public code?: string) {;
    super(message);
}
    this.name = 'APIError'}
}
export function isAPIError(error: unknown): error is APIError {
  ;
  return error instanceof APIError
}
}
export function handleAPIError(error: unknown): never {
  ;
  if (axios.isAxiosError(error)) {;
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || error.message;
    throw new APIError(message, status);
}
  }
  if (error instanceof Error) {
  ;
    throw new APIError(error.message, 500);
}
  }
  throw new APIError('An unknown error occurred', 500);