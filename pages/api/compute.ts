import fs from 'fs';
import { join } from 'path';

import { compute } from '../../lib/compute';

export default async function handler(req, res) {
  const { slug, tag, timePeriod, location } = JSON.parse(req.body);
  const dataDir = join(process.cwd(), '_dump');
  const fullPath = join(dataDir, `${slug}.json`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { collectives: allCollectives, categories } = JSON.parse(fileContents);
  const computed = compute({ tag, location, timePeriod, allCollectives, categories });
  res.status(200).json({ collectives: computed.collectives, stats: computed.stats, series: computed.series });
}
