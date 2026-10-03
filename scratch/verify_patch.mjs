

async function run() {
  const baseUrl = 'http://localhost:3000/api/notion';

  // 1. Get current week
  const weekRes = await fetch(`${baseUrl}/weeks/current`);
  const weekJson = await weekRes.json();
  const weekId = weekJson.data.id;

  // 2. Create test record
  console.log('Creating test record...');
  const createRes = await fetch(`${baseUrl}/content/editorials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: '[TEST] Phase 9 Verification Record',
      weekId,
      source: 'Other',
      keyPoints: 'Testing saved and revision state mutations',
    })
  });
  
  if (!createRes.ok) {
    console.error('Failed to create test record:', await createRes.text());
    return;
  }
  
  const createJson = await createRes.json();
  const recordId = createJson.data.id;
  console.log('Created record ID:', recordId);
  console.log('Initial saved:', createJson.data.fields.saved);
  console.log('Initial revision:', createJson.data.fields.revision);

  // 3. Update saved and revision
  console.log('\nUpdating saved to true and revision to Reading...');
  const patchRes = await fetch(`${baseUrl}/content/editorials/${recordId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      saved: true,
      revision: 'Reading'
    })
  });

  if (!patchRes.ok) {
    console.error('Failed to patch record:', await patchRes.text());
    return;
  }

  const patchJson = await patchRes.json();
  console.log('Updated saved:', patchJson.data.fields.saved);
  console.log('Updated revision:', patchJson.data.fields.revision);

  // 4. Clean up test record
  console.log('\nCleaning up test record...');
  const deleteRes = await fetch(`${baseUrl}/content/editorials/${recordId}`, {
    method: 'DELETE'
  });
  if (!deleteRes.ok) {
    console.error('Failed to delete test record:', await deleteRes.text());
    return;
  }
  console.log('Test record deleted successfully.');
  
  // 5. Test search filters
  console.log('\nTesting search API...');
  const searchRes = await fetch(`${baseUrl}/search?section=editorials&limit=5`);
  const searchJson = await searchRes.json();
  console.log(`Found ${searchJson.data.length} records. Search API OK.`);
}

run().catch(console.error);
