export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
  
  static badRequest(message: string, details?: any): AppError {
    return new AppError(message, 400, 'BAD_REQUEST', details);
  }
  
  static notFound(message: string, details?: any): AppError {
    return new AppError(message, 404, 'NOT_FOUND', details);
  }
  
  static unauthorized(message: string, details?: any): AppError {
    return new AppError(message, 401, 'UNAUTHORIZED', details);
  }
  
  static forbidden(message: string, details?: any): AppError {
    return new AppError(message, 403, 'FORBIDDEN', details);
  }
  
  static internal(message: string, details?: any): AppError {
    return new AppError(message, 500, 'INTERNAL_ERROR', details);
  }
}
