export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    processingTime?: number;
  };
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    stack?: string;
  };
  metadata: {
    timestamp: string;
    requestId: string;
  };
}

export interface ValidationError extends ErrorResponse {
  error: {
    code: 'VALIDATION_ERROR';
    message: string;
    details: {
      field: string;
      message: string;
      value?: any;
    }[];
  };
}

export interface AuthenticationError extends ErrorResponse {
  error: {
    code: 'AUTHENTICATION_ERROR';
    message: string;
    details?: {
      reason: string;
      requiredPermissions?: string[];
    };
  };
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  metadata: {
    timestamp: string;
    requestId: string;
    processingTime?: number;
  };
}
