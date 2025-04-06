import Server from './server';
import logger from './utils/logger';
import config from './config';

// Verify necessary config
if (!config.notionApiKey) {
  logger.error('Notion API key is not set. Please set NOTION_API_KEY env variable or add it to config.json');
  process.exit(1);
}

if (!config.databaseId) {
  logger.error('Notion database ID is not set. Please set NOTION_DATABASE_ID env variable or add it to config.json');
  process.exit(1);
}

// Start the server
const server = new Server();

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection:', error);
  process.exit(1);
});

// Start the server
server.start();

export default server;
