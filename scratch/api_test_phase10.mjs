
async function testPhase10Apis() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('Testing Phase 10 APIs...\n');

  // 1. Test Archive API
  console.log('--- 1. Testing GET /api/notion/weeks/archive ---');
  const archiveRes = await fetch(`${baseUrl}/api/notion/weeks/archive?limit=5`);
  const archiveData = await archiveRes.json();
  
  if (!archiveData.success) {
    console.error('❌ Archive API failed:', archiveData);
    return;
  }
  
  console.log('✅ Archive API returned successfully.');
  console.log(`Found ${archiveData.data.items.length} weeks.`);
  
  if (archiveData.data.items.length > 0) {
    const latestWeek = archiveData.data.items[0];
    console.log(`Latest Week: W${latestWeek.week.weekNumber} (${latestWeek.week.id})`);
    console.log(`Summary: ${JSON.stringify(latestWeek.summary)}`);
    console.log(`Coverage: ${latestWeek.coveragePercentage}%`);
    
    // 2. Test Weekly Review API
    console.log('\n--- 2. Testing GET /api/notion/weeks/[id]/review ---');
    const reviewRes = await fetch(`${baseUrl}/api/notion/weeks/${latestWeek.week.id}/review`);
    const reviewData = await reviewRes.json();
    
    if (!reviewData.success) {
      console.error('❌ Weekly Review API failed:', reviewData);
      return;
    }
    
    console.log('✅ Weekly Review API returned successfully.');
    const d = reviewData.data;
    console.log(`Total records: ${d.summary.total}`);
    console.log(`Coverage gaps: ${d.coverageGaps.length}`);
    console.log(`Saved items: ${d.savedRecords?.length || 0}`);
    console.log(`Items to revise: ${d.revisionQueue?.length || 0}`);
    console.log(`Sections processed: ${d.sections.length}`);
    
    // Briefing Mode verification
    const sectionsCount = Object.keys(d.recordsBySection || {}).length;
    console.log(`Briefing sections map size: ${sectionsCount}`);
    
    // Continuity verification
    if (d.continuity) {
      console.log(`Continuity Delta: Items ${d.continuity.itemsDiff}, Saved ${d.continuity.savedDiff}`);
    } else {
      console.log('No continuity data (might be oldest week)');
    }
  } else {
    console.log('No weeks available to test Weekly Review.');
  }
}

testPhase10Apis().catch(console.error);
