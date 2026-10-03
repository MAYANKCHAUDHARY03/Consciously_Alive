import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const dbId = process.env.NOTION_DB_GENERAL_AWARENESS;

async function testE2E() {
  console.log('--- STARTING E2E TEST ---');

  let pageId = null;
  try {
    // 1. Create a temporary record
    console.log('1. Creating temporary record in General Awareness...');
    const createRes = await notion.pages.create({
      parent: { database_id: dbId },
      properties: {
        Name: {
          title: [{ text: { content: 'E2E Test Record' } }]
        }
      }
    });
    
    pageId = createRes.id;
    console.log(`✓ Created record: ${pageId}`);

    // 2. Patch the record with Saved and Revision
    console.log('2. Patching record with Saved=true, Revision=Reading...');
    const patchRes = await notion.pages.update({
      page_id: pageId,
      properties: {
        Saved: {
          checkbox: true
        },
        Revision: {
          select: {
            name: 'Reading'
          }
        }
      }
    });
    
    console.log(`✓ Patched record successfully`);

    // 3. Verify the state in Notion
    console.log('3. Fetching record to verify state...');
    const getRes = await notion.pages.retrieve({ page_id: pageId });
    
    const isSaved = getRes.properties.Saved?.checkbox;
    const revisionStatus = getRes.properties.Revision?.select?.name;
    
    console.log(`- Saved state: ${isSaved}`);
    console.log(`- Revision state: ${revisionStatus}`);
    
    if (isSaved === true && revisionStatus === 'Reading') {
      console.log('✓ E2E TEST PASSED!');
    } else {
      console.error('✗ E2E TEST FAILED: State mismatch');
    }

  } catch (err) {
    console.error('✗ E2E TEST FAILED with error:', err.message);
    if (err.body) console.error(err.body);
  } finally {
    // 4. Delete the temporary record (archive it)
    if (pageId) {
      console.log(`4. Deleting (archiving) temporary record: ${pageId}...`);
      await notion.pages.update({
        page_id: pageId,
        archived: true
      });
      console.log('✓ Deleted record');
    }
  }
}

testE2E();
