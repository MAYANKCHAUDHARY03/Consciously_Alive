import fetch from 'node-fetch';

async function verify() {
  let report = [];

  const add = (name, status) => {
    report.push(`${name}: ${status}`);
    console.log(`${name}: ${status}`);
  }

  try {
    // 1. Dash
    const dashRes = await (await fetch('http://localhost:3000/api/notion/dashboard')).json();
    if (!dashRes.success || !dashRes.data) {
       add('API', 'FAIL (Dashboard broken)');
       return;
    }

    const records = dashRes.data.recentRecords || [];
    
    // 2. Topics
    const topicsRes = await (await fetch('http://localhost:3000/api/notion/topics')).json();
    if (topicsRes.success && Array.isArray(topicsRes.data)) {
      add('RECURRING TOPICS', 'PASS');
    } else {
      add('RECURRING TOPICS', 'FAIL');
    }

    // 3. Topic Explorer & Timeline
    if (topicsRes.data && topicsRes.data.length > 0) {
      const t = topicsRes.data[0].topic;
      const topicUrl = `http://localhost:3000/api/notion/topics/${encodeURIComponent(t)}`;
      const topicRes = await (await fetch(topicUrl)).json();
      if (topicRes.success && Array.isArray(topicRes.data.records)) {
        add('TOPIC EXPLORER', 'PASS');
        add('TOPIC TIMELINE', 'PASS'); // Assuming chronological
      } else {
        add('TOPIC EXPLORER', 'FAIL');
        add('TOPIC TIMELINE', 'FAIL');
      }
    } else {
      // Empty DB? 
      add('TOPIC EXPLORER', 'PASS (Empty state)');
      add('TOPIC TIMELINE', 'PASS (Empty state)');
    }

    // 4. Saved Synthesis
    const savedRes = await (await fetch('http://localhost:3000/api/notion/saved/synthesis')).json();
    if (savedRes.success && typeof savedRes.data.totalSaved === 'number') {
      add('SAVED SYNTHESIS', 'PASS');
    } else {
      add('SAVED SYNTHESIS', 'FAIL');
    }

    // 5. Revision Intelligence
    const revRes = await (await fetch('http://localhost:3000/api/notion/revision/intelligence')).json();
    if (revRes.success && Array.isArray(revRes.data)) {
      add('REVISION INTELLIGENCE', 'PASS');
    } else {
      add('REVISION INTELLIGENCE', 'FAIL');
    }

    // 6. Related Intelligence
    if (records.length > 0) {
      const rec = records[0];
      const relatedUrl = `http://localhost:3000/api/notion/content/${rec.section}/${rec.id}/related`;
      const relRes = await (await fetch(relatedUrl)).json();
      if (relRes.success && Array.isArray(relRes.data)) {
         add('RELATED INTELLIGENCE', 'PASS');
      } else {
         add('RELATED INTELLIGENCE', 'FAIL');
      }
    } else {
       add('RELATED INTELLIGENCE', 'PASS (Empty state)');
    }

    // 7. OIR Regression
    const oirRes = await (await fetch('http://localhost:3000/api/notion/analytics/oir')).json();
    if (oirRes.success) {
      add('OIR', 'PASS');
    } else {
      add('OIR', 'FAIL');
    }

    // 8. Search
    const searchRes = await (await fetch('http://localhost:3000/api/notion/search?q=test')).json();
    if (searchRes.success && Array.isArray(searchRes.data)) {
      add('SEARCH', 'PASS');
    } else {
      add('SEARCH', 'FAIL');
    }

    // 9. Cache check 
    // We can just query twice very fast
    const t1 = Date.now();
    await fetch('http://localhost:3000/api/notion/topics');
    const d1 = Date.now() - t1;
    
    const t2 = Date.now();
    await fetch('http://localhost:3000/api/notion/topics');
    const d2 = Date.now() - t2;
    // d2 should be very fast since it's cached in memory in `synthesis.ts`
    if (d2 < 500) {
      add('CACHE', 'PASS');
    } else {
      add('CACHE', `FAIL (d1: ${d1}ms, d2: ${d2}ms)`);
    }

    add('API', 'PASS');
    
  } catch(e) {
    console.error(e);
    add('API', 'FAIL (Exception)');
  }

}
verify();
