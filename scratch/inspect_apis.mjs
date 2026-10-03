async function testApis() {
  const baseUrl = 'http://localhost:3000';
  
  const get = async (path) => {
    console.log(`\nTesting ${path}...`);
    try {
      const res = await fetch(`${baseUrl}${path}`);
      const json = await res.json();
      console.log(`✅ ${path} OK - Keys:`, Object.keys(json));
      
      if (json.data) {
          if (Array.isArray(json.data)) {
              console.log('  Data is an Array of length:', json.data.length);
          } else {
              console.log('  Data Keys:', Object.keys(json.data));
          }
      }
      if (json.results) {
          console.log('  Results is an Array of length:', json.results.length);
      }
      return json;
    } catch (e) {
      console.error(`❌ ${path} FAILED: ${e.message}`);
      return null;
    }
  };

  await get('/api/notion/weeks');
  await get('/api/notion/weeks/current');
  await get('/api/notion/dashboard');
  await get('/api/notion/search');
  await get('/api/notion/content/general-awareness');
  await get('/api/notion/analytics/oir');
  
  const archive = await get('/api/notion/weeks/archive');
  if (archive && archive.data && archive.data.length > 0) {
      const weekId = archive.data[0].week.id;
      await get(`/api/notion/weeks/${weekId}/review`);
  }
}

testApis().catch(console.error);
