export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
  metadata?: {
    timestamp: string
    requestId: string
    processingTime?: number
  }
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}


export interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
    stack?: string
  }
  metadata?: {
    timestamp: string
    requestId?: string
  }
}

export interface ValidationError extends Omit<ErrorResponse, 'error'> {
  error: {
    code: 'VALIDATION_ERROR'
    message: string
    details: Array<{
      field: string
      message: string
      value?: unknown
    }>
  }
}

export interface AuthenticationError extends ErrorResponse {
  error: {
    code: 'AUTHENTICATION_ERROR'
    message: string
    details?: {
      reason: string
      requiredPermissions?: string[]
    }
  }
}

export interface SuccessResponse<T> {
  success: true
  data: T
  metadata?: {
    timestamp: string
    requestId?: string
    processingTime?: number
  }
}