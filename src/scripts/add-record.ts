import { createPage } from '../lib/notion/pages';
import { getDataSourceIds } from '../lib/notion/config';
import { selectProp, relationProp, titleProp } from '../lib/notion/properties';

async function run() {
  const dsIds = getDataSourceIds();
  const weekId = '3ed5fd82-d2cf-8118-ac5c-e30eb43c72d0';
  
  await createPage(dsIds.generalAwareness, {
    'Name': titleProp('Test GA Record'),
    'Category': selectProp('History'),
    'Week': relationProp([weekId])
  });
  console.log('Record created!');
}
run();
