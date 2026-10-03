import fs from 'fs';

async function testApi(endpoint) {
  try {
    const res = await fetch(`http://localhost:3000${endpoint}`);
    if (res.ok) {
      const json = await res.json();
      return json;
    }
  } catch (e) {
  }
  return null;
}

async function run() {
  const topicsRes = await testApi('/api/notion/topics');
  if (topicsRes?.success) {
    console.log(`Topics returned: ${topicsRes.data.length}`);
    if (topicsRes.data.length > 0) {
      console.log(`First topic:`, topicsRes.data[0]);
    }
  }

  const savedRes = await testApi('/api/notion/saved/synthesis');
  if (savedRes?.success) {
    console.log(`Saved synthesis totalSaved: ${savedRes.data.totalSaved}, unread: ${savedRes.data.unread}`);
  }

  const revRes = await testApi('/api/notion/revision/intelligence');
  if (revRes?.success) {
    console.log(`Revision intelligence records: ${revRes.data.length}`);
  }

  const dashRes = await testApi('/api/notion/dashboard');
  if (dashRes?.success && dashRes.data.recentRecords?.length > 0) {
    const rec = dashRes.data.recentRecords[0];
    const relatedRes = await testApi(`/api/notion/content/${rec.section}/${rec.id}/related`);
    if (relatedRes?.success) {
      console.log(`Related records for ${rec.id}: ${relatedRes.data.length}`);
      if (relatedRes.data.length > 0) {
         console.log(`First related:`, relatedRes.data[0].score, relatedRes.data[0].reason);
      }
    }
  }
}
run();
