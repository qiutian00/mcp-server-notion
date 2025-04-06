import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Default config
const defaultConfig = {
  port: 3000,
  notionApiKey: '',
  databaseId: '',
  tagProperty: 'Tags',
  contentProperty: 'Content',
};

// Try to load local config file
let localConfig = {};
const configPath = path.join(process.cwd(), 'config.json');

if (fs.existsSync(configPath)) {
  try {
    const configFile = fs.readFileSync(configPath, 'utf8');
    localConfig = JSON.parse(configFile);
  } catch (error) {
    console.error('Failed to parse config file:', error);
  }
}

// Environment variables take precedence
const config = {
  ...defaultConfig,
  ...localConfig,
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : defaultConfig.port,
  notionApiKey: process.env.NOTION_API_KEY || localConfig.notionApiKey || defaultConfig.notionApiKey,
  databaseId: process.env.NOTION_DATABASE_ID || localConfig.databaseId || defaultConfig.databaseId,
  tagProperty: process.env.NOTION_TAG_PROPERTY || localConfig.tagProperty || defaultConfig.tagProperty,
  contentProperty: process.env.NOTION_CONTENT_PROPERTY || localConfig.contentProperty || defaultConfig.contentProperty,
};

export default config;
