import { Client } from '@notionhq/client';
import config from './config';
import logger from './utils/logger';
import { AppError } from './utils/error';

export interface NotionMemo {
  id: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

class NotionService {
  private client: Client;
  private databaseId: string;
  private tagProperty: string;
  private contentProperty: string;

  constructor() {
    this.client = new Client({ auth: config.notionApiKey });
    this.databaseId = config.databaseId;
    this.tagProperty = config.tagProperty;
    this.contentProperty = config.contentProperty;
  }

  /**
   * Create a new memo in Notion
   */
  async createMemo(content: string, tags: string[] = []): Promise<NotionMemo> {
    try {
      // Prepare tag multi-select property
      const tagSelects = tags.map(tag => ({ name: tag }));
      
      const response = await this.client.pages.create({
        parent: {
          database_id: this.databaseId,
        },
        properties: {
          [this.contentProperty]: {
            title: [
              {
                type: 'text',
                text: {
                  content: content.slice(0, 100),  // Title is first 100 chars of content
                }
              }
            ]
          },
          [this.tagProperty]: {
            multi_select: tagSelects
          }
        },
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: content,
                  }
                }
              ]
            }
          }
        ]
      });

      logger.info(`Created new Notion memo with ID: ${response.id}`);
      
      const createdAt = response.created_time;
      const updatedAt = response.last_edited_time;

      return {
        id: response.id,
        content,
        tags,
        createdAt,
        updatedAt
      };
    } catch (error) {
      logger.error(`Failed to create Notion memo: ${error}`);
      throw new AppError(`Failed to create Notion memo: ${error}`, 500);
    }
  }

  /**
   * Retrieve memos from Notion database with optional tag filter
   */
  async getMemos(tag?: string, limit: number = this.databaseId ? 50 : 10): Promise<NotionMemo[]> {
    try {
      const filter = tag ? {
        property: this.tagProperty,
        multi_select: {
          contains: tag
        }
      } : undefined;

      const response = await this.client.databases.query({
        database_id: this.databaseId,
        filter,
        sorts: [
          {
            property: 'created_time',
            direction: 'descending',
          },
        ],
        page_size: limit,
      });

      const memos: NotionMemo[] = [];

      for (const page of response.results) {
        // Get the page properties
        const properties = page.properties;
        
        // Extract content and tags
        let content = '';
        let tags: string[] = [];

        if (properties[this.contentProperty] && 'title' in properties[this.contentProperty]) {
          const titleArray = properties[this.contentProperty].title;
          content = titleArray.map(t => t.plain_text).join('');
        }

        if (properties[this.tagProperty] && 'multi_select' in properties[this.tagProperty]) {
          tags = properties[this.tagProperty].multi_select.map(tag => tag.name);
        }

        // Get the full content from the page blocks
        const blocksResponse = await this.client.blocks.children.list({
          block_id: page.id,
        });
        
        for (const block of blocksResponse.results) {
          if (block.type === 'paragraph' && 'paragraph' in block) {
            const richText = block.paragraph.rich_text;
            content = richText.map(text => text.plain_text).join('');
            break; // Just get the first paragraph for simplicity
          }
        }

        memos.push({
          id: page.id,
          content,
          tags,
          createdAt: page.created_time,
          updatedAt: page.last_edited_time,
        });
      }

      return memos;
    } catch (error) {
      logger.error(`Failed to retrieve Notion memos: ${error}`);
      throw new AppError(`Failed to retrieve Notion memos: ${error}`, 500);
    }
  }

  /**
   * Delete a memo from Notion
   */
  async deleteMemo(id: string): Promise<boolean> {
    try {
      await this.client.pages.update({
        page_id: id,
        archived: true,
      });
      
      logger.info(`Archived Notion memo with ID: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete Notion memo: ${error}`);
      throw new AppError(`Failed to delete Notion memo: ${error}`, 500);
    }
  }

  /**
   * Update a memo in Notion
   */
  async updateMemo(id: string, content: string, tags?: string[]): Promise<NotionMemo> {
    try {
      // Update properties
      const properties: any = {};
      
      // Update content
      if (content) {
        properties[this.contentProperty] = {
          title: [
            {
              type: 'text',
              text: {
                content: content.slice(0, 100), // Title is first 100 chars of content
              }
            }
          ]
        };
      }
      
      // Update tags if provided
      if (tags) {
        properties[this.tagProperty] = {
          multi_select: tags.map(tag => ({ name: tag }))
        };
      }
      
      // Update the page properties
      await this.client.pages.update({
        page_id: id,
        properties
      });
      
      // Update the content in blocks
      if (content) {
        // First, archive existing blocks to replace them
        const existingBlocks = await this.client.blocks.children.list({
          block_id: id
        });
        
        for (const block of existingBlocks.results) {
          await this.client.blocks.delete({
            block_id: block.id
          });
        }
        
        // Add new content block
        await this.client.blocks.children.append({
          block_id: id,
          children: [
            {
              object: 'block',
              type: 'paragraph',
              paragraph: {
                rich_text: [
                  {
                    type: 'text',
                    text: {
                      content: content,
                    }
                  }
                ]
              }
            }
          ]
        });
      }
      
      // Get the updated page
      const page = await this.client.pages.retrieve({ page_id: id });
      
      let updatedTags: string[] = [];
      if (page.properties[this.tagProperty] && 'multi_select' in page.properties[this.tagProperty]) {
        updatedTags = page.properties[this.tagProperty].multi_select.map(tag => tag.name);
      }
      
      logger.info(`Updated Notion memo with ID: ${id}`);
      
      return {
        id,
        content,
        tags: updatedTags,
        createdAt: page.created_time,
        updatedAt: page.last_edited_time
      };
    } catch (error) {
      logger.error(`Failed to update Notion memo: ${error}`);
      throw new AppError(`Failed to update Notion memo: ${error}`, 500);
    }
  }
}

export default new NotionService();
