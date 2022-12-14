import fs from 'fs';
import { join } from 'path';

import { compute } from '../../lib/compute';

export default async function handler(req, res) {
  const { slug, tag, timePeriod, location } = JSON.parse(req.body);
  const startTime = Date.now();
  const dataDir = join(process.cwd(), '_dump');
  const fullPath = join(dataDir, `${slug}.json`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { collectives: allCollectives, categories } = JSON.parse(fileContents);
  const parsedJsonTime = Date.now();
  const computed = compute({ filter: { tag, location, timePeriod }, allCollectives, categories });
  const computedTime = Date.now();
  res.status(200).json({
    collectives: computed.collectives,
    stats: computed.stats,
    series: computed.series,
    time: {
      total: computedTime - startTime,
      compute: computedTime - parsedJsonTime,
      parseJson: parsedJsonTime - startTime,
    },
  });
}
