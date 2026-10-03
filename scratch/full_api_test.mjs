async function testApis() {
  const baseUrl = 'http://localhost:3000';
  const errors = [];
  
  const checkEndpoint = async (path, validators) => {
    console.log(`\nTesting ${path}...`);
    try {
      const res = await fetch(`${baseUrl}${path}`);
      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }
      const json = await res.json();
      
      if (!json.success) {
        throw new Error(`API returned success: false - ${json.error}`);
      }
      
      const data = json.data;
      if (!data) {
        throw new Error('Response missing "data" field');
      }
      
      validators(data);
      console.log(`✅ ${path} OK`);
      return data;
    } catch (e) {
      console.error(`❌ ${path} FAILED: ${e.message}`);
      errors.push({ path, error: e.message });
      return null;
    }
  };

  // 1. GET /api/notion/weeks
  const weeksData = await checkEndpoint('/api/notion/weeks', data => {
    if (!Array.isArray(data.items)) throw new Error('data.items must be an array');
  });

  // 2. GET /api/notion/weeks/current
  const currentWeekData = await checkEndpoint('/api/notion/weeks/current', data => {
    if (!data.id) throw new Error('Missing week ID in current week');
  });

  // 3. GET /api/notion/dashboard
  await checkEndpoint('/api/notion/dashboard', data => {
    if (!data.week || !data.stats || !Array.isArray(data.recent)) {
      throw new Error('Dashboard payload missing week, stats, or recent array');
    }
  });

  // 4. GET /api/notion/search
  await checkEndpoint('/api/notion/search', data => {
    if (!Array.isArray(data.results)) throw new Error('Search payload missing results array');
  });

  // 5. GET /api/notion/content/general-awareness
  await checkEndpoint('/api/notion/content/general-awareness', data => {
    if (!Array.isArray(data.items)) throw new Error('Content list missing items array');
  });

  // 6. GET /api/notion/analytics/oir
  await checkEndpoint('/api/notion/analytics/oir', data => {
    if (!Array.isArray(data.history)) throw new Error('OIR Analytics missing history array');
  });
  
  // 7. GET /api/notion/weeks/archive
  const archiveData = await checkEndpoint('/api/notion/weeks/archive', data => {
    if (!Array.isArray(data.items)) throw new Error('Archive missing items array');
    if (data.items.length > 0) {
      const first = data.items[0];
      if (!first.week || !first.summary || typeof first.coveragePercentage !== 'number') {
        throw new Error('Archive item missing week, summary, or coveragePercentage');
      }
    }
  });

  // 8. GET /api/notion/weeks/[weekId]/review
  if (archiveData && archiveData.items.length > 0) {
    const weekId = archiveData.items[0].week.id;
    await checkEndpoint(`/api/notion/weeks/${weekId}/review`, data => {
      if (!data.summary || !data.sections || !data.revision || !Array.isArray(data.coverageGaps)) {
        throw new Error('Review payload missing summary, sections, revision, or coverageGaps');
      }
      if (!data.recordsBySection || !Array.isArray(data.revisionQueue)) {
        throw new Error('Review payload missing recordsBySection or revisionQueue');
      }
    });
  }

  if (errors.length > 0) {
    console.log('\n❌ SUMMARY: Some APIs failed.');
    console.log(errors);
  } else {
    console.log('\n✅ SUMMARY: All APIs passed structural verification!');
  }
}

testApis().catch(console.error);
