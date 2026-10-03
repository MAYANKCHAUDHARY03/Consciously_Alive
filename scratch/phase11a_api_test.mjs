import fs from 'fs';

async function testApi(endpoint) {
  console.log(`\nTesting ${endpoint}...`);
  try {
    const res = await fetch(`http://localhost:3000${endpoint}`);
    console.log(`HTTP Status: ${res.status}`);
    if (res.ok) {
      const data = await res.json();
      console.log(`Response length/keys:`, Array.isArray(data) ? data.length : Object.keys(data).length);
      // Log a snippet
      if (Array.isArray(data) && data.length > 0) {
        console.log(`First item keys:`, Object.keys(data[0]));
      } else if (!Array.isArray(data)) {
        console.log(`Keys:`, Object.keys(data));
      }
      return { ok: true, data };
    } else {
      const text = await res.text();
      console.log(`Error Response:`, text.slice(0, 100));
      return { ok: false, error: text };
    }
  } catch (e) {
    console.log(`Fetch failed: ${e.message}`);
    return { ok: false, error: e.message };
  }
}

async function run() {
  const tests = [
    '/api/notion/topics',
    '/api/notion/revision/intelligence',
    '/api/notion/saved/synthesis',
  ];

  let topicToTest = 'not found';

  for (const t of tests) {
    const res = await testApi(t);
    if (t === '/api/notion/topics' && res.ok && res.data.length > 0) {
      topicToTest = res.data[0].topic;
    }
  }

  if (topicToTest !== 'not found') {
    await testApi(`/api/notion/topics/${encodeURIComponent(topicToTest)}`);
  }

  // Need to find a record to test related records
  const dashboard = await testApi('/api/notion/dashboard');
  if (dashboard.ok && dashboard.data.recentRecords && dashboard.data.recentRecords.length > 0) {
    const rec = dashboard.data.recentRecords[0];
    await testApi(`/api/notion/content/${rec.section}/${rec.id}/related`);
  }
}

run();
