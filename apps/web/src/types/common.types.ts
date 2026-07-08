/**
 * Standard API response wrapper.
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode: number;
}

/**
 * Paginated API response.
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  statusCode: number;
}


/**
 * Timestamp fields present on all database documents.
 */
export interface TimestampFields {
  createdAt: Date;
  updatedAt: Date;
}
