import fs from 'fs';

async function testApi(endpoint) {
  try {
    const res = await fetch(`http://localhost:3000${endpoint}`);
    if (res.ok) {
      const json = await res.json();
      return json;
    } else {
      console.log('Failed:', endpoint, res.status);
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
  return null;
}

async function run() {
  const dashRes = await testApi('/api/notion/dashboard');
  if (dashRes && dashRes.recentRecords?.length > 0) {
    const rec = dashRes.recentRecords[0];
    const relatedRes = await testApi(`/api/notion/content/${rec.section}/${rec.id}/related`);
    if (relatedRes) {
      console.log(`Related records for ${rec.id}:`, relatedRes.length);
      if (relatedRes.length > 0) {
         console.log(`First related:`, relatedRes[0].score, relatedRes[0].reason);
      }
    }
  } else if (dashRes?.success && dashRes.data?.recentRecords?.length > 0) {
    const rec = dashRes.data.recentRecords[0];
    const relatedRes = await testApi(`/api/notion/content/${rec.section}/${rec.id}/related`);
    if (relatedRes?.success) {
      console.log(`Related records for ${rec.id}:`, relatedRes.data.length);
    } else if (Array.isArray(relatedRes)) {
      console.log(`Related records for ${rec.id}:`, relatedRes.length);
    }
  } else {
    console.log("Could not parse dashboard data:", Object.keys(dashRes || {}));
  }
}
run();
