import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const DS_IDS = {
  'General Awareness': process.env.NOTION_DS_GENERAL_AWARENESS,
  'Defence Updates': process.env.NOTION_DS_DEFENCE_UPDATES,
  'Current Affairs': process.env.NOTION_DS_CURRENT_AFFAIRS,
  'Editorials': process.env.NOTION_DS_EDITORIALS,
  'Vocabulary': process.env.NOTION_DS_VOCABULARY,
  'OIR Practice': process.env.NOTION_DS_OIR_SETS,
  'Resources': process.env.NOTION_DS_RESOURCES,
};

const EXPECTED_REVISION_OPTIONS = [
  { name: 'Unread', color: 'default' },
  { name: 'Reading', color: 'yellow' },
  { name: 'Reviewed', color: 'blue' },
  { name: 'Revised', color: 'green' },
];

async function reconcileSchemas() {
  console.log('| Database | Saved | Revision | Revision Type | Status |');
  console.log('|----------|-------|----------|---------------|--------|');
  
  for (const [name, id] of Object.entries(DS_IDS)) {
    if (!id) {
      console.log(`| ${name} | N/A | N/A | N/A | MISSING ID |`);
      continue;
    }
    
    try {
      const ds = await notion.dataSources.retrieve({ data_source_id: id });
      const props = ds.properties;
      
      const savedProp = props['Saved'];
      const revProp = props['Revision'];
      
      const hasSaved = savedProp && savedProp.type === 'checkbox';
      let hasRevision = false;
      let revType = revProp ? revProp.type : 'NONE';
      
      if (revProp && revProp.type === 'select') {
        const optionNames = revProp.select.options.map(o => o.name).sort();
        const expectedNames = EXPECTED_REVISION_OPTIONS.map(o => o.name).sort();
        
        if (JSON.stringify(optionNames) === JSON.stringify(expectedNames)) {
          hasRevision = true;
        }
      }
      
      let status = 'OK';
      let propertiesToUpdate = {};
      
      if (!hasSaved) {
        propertiesToUpdate['Saved'] = { checkbox: {} };
      }
      
      if (!hasRevision) {
        propertiesToUpdate['Revision'] = {
          select: {
            options: EXPECTED_REVISION_OPTIONS
          }
        };
      }
      
      if (Object.keys(propertiesToUpdate).length > 0) {
        await notion.dataSources.update({
          data_source_id: id,
          properties: propertiesToUpdate
        });
        status = `MIGRATED (${Object.keys(propertiesToUpdate).join(', ')})`;
      }
      
      console.log(`| ${name} | ${hasSaved ? 'YES' : 'ADDED'} | ${hasRevision ? 'YES' : 'ADDED/UPDATED'} | select | ${status} |`);
      
    } catch (err) {
      console.log(`| ${name} | ERROR | ERROR | ERROR | ${err.message} |`);
    }
  }
}

reconcileSchemas();
