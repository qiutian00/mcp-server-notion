import logger from './logger';

export class AppError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleError = (error: Error | AppError, res?: any) => {
  if (error instanceof AppError) {
    logger.error(`${error.statusCode} - ${error.message}`, { stack: error.stack });
    
    if (res) {
      return res.status(error.statusCode).json({
        status: 'error',
        statusCode: error.statusCode,
        message: error.message
      });
    }
  } else {
    logger.error(error.message, { stack: error.stack });
    
    if (res) {
      return res.status(500).json({
        status: 'error',
        statusCode: 500,
        message: 'Internal server error'
      });
    }
  }
};
