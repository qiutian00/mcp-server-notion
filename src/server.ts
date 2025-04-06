import express from 'express';
import router from './router';
import config from './config';
import logger from './utils/logger';

class Server {
  private app: express.Application;
  
  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.configureRoutes();
  }
  
  private configureMiddleware(): void {
    // Parse JSON request bodies
    this.app.use(express.json());
    // Parse URL-encoded request bodies
    this.app.use(express.urlencoded({ extended: true }));
    
    // Log requests
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.url}`);
      next();
    });
  }
  
  private configureRoutes(): void {
    // API routes
    this.app.use('/api', router);
    
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        status: 'error',
        message: `Can't find ${req.originalUrl} on this server`
      });
    });
  }
  
  public start(): void {
    const port = config.port;
    
    this.app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });
  }
  
  public getApp(): express.Application {
    return this.app;
  }
}

export default Server;
