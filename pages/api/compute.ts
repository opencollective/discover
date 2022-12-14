import { compute } from '../../lib/compute';

export default async function handler(req, res) {
  const { slug, tag, timePeriod, location } = JSON.parse(req.body);
  const startTime = Date.now();

  const file = require(`../../_dump/${slug}.json`);

  // return something when just trying to wake the function
  if (!timePeriod) {
    return res.status(200);
  }
  const { collectives: allCollectives, categories } = file; // JSON.parse(fileContents);
  const parseDataTime = Date.now();
  const computed = compute({ filter: { tag, location, timePeriod }, allCollectives, categories });
  const computedTime = Date.now();
  res.status(200).json({
    collectives: computed.collectives,
    stats: computed.stats,
    series: computed.series,
    time: {
      total: computedTime - startTime,
      compute: computedTime - parseDataTime,
      parseData: parseDataTime - startTime,
    },
  });
}
