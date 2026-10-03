import { Client } from '@notionhq/client';
import * as fs from 'fs';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const DB_IDS = {
  'General Awareness': process.env.NOTION_DB_GENERAL_AWARENESS,
  'Defence Updates': process.env.NOTION_DB_DEFENCE_UPDATES,
  'Current Affairs': process.env.NOTION_DB_CURRENT_AFFAIRS,
  'Editorials': process.env.NOTION_DB_EDITORIALS,
  'Vocabulary': process.env.NOTION_DB_VOCABULARY,
  'OIR Practice': process.env.NOTION_DB_OIR_SETS,
  'Resources': process.env.NOTION_DB_RESOURCES,
};

async function inspectSchemas() {
  console.log('| Database | Saved | Saved Type | Revision | Revision Type | Status |');
  console.log('|----------|-------|------------|----------|---------------|--------|');
  
  for (const [name, id] of Object.entries(DB_IDS)) {
    if (!id) {
      console.log(`| ${name} | N/A | N/A | N/A | N/A | MISSING ID |`);
      continue;
    }
    
    try {
      const db = await notion.databases.retrieve({ database_id: id });
      const props = db.properties;
      
      const savedProp = props['Saved'];
      const revProp = props['Revision'];
      
      const savedType = savedProp ? savedProp.type : 'NONE';
      const revType = revProp ? revProp.type : 'NONE';
      
      const status = (savedType === 'checkbox' && revType === 'select') ? 'OK' : 'NEEDS MIGRATION';
      
      console.log(`| ${name} | ${!!savedProp} | ${savedType} | ${!!revProp} | ${revType} | ${status} |`);
      
    } catch (err) {
      console.log(`| ${name} | ERROR | ERROR | ERROR | ERROR | ${err.message} |`);
    }
  }
}

inspectSchemas();
