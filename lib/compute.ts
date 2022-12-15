import filterLocation from './location/filterLocation';
import { computeStats, computeTimeSeries } from './compute-data-wo-time';

export function compute({ filter: { tag, location, timePeriod }, categories, allCollectives }) {
  const locationFilteredCollectives = filterLocation(allCollectives, location);
  const categoriesWithCollectives = categories.map(category => {
    const collectivesInCategory = locationFilteredCollectives.filter(
      collective => category.tag === 'ALL' || collective.tags?.includes(category.tag),
    );
    return {
      ...category,
      collectives: collectivesInCategory,
    };
  });

  const currentCategory = categoriesWithCollectives.find(category =>
    tag ? category.tag === tag : category.tag === 'ALL',
  );
  const timePeriodToTimeUnit = {
    PAST_QUARTER: 'WEEK',
    PAST_YEAR: 'MONTH',
    ALL: 'YEAR',
  };

  const timeSeries = computeTimeSeries(
    categoriesWithCollectives.filter(c => tag === 'ALL' || c.tag === tag),
    timePeriodToTimeUnit[timePeriod],
  );

  const stats = computeStats(currentCategory?.collectives);

  return {
    series: timeSeries,
    stats: stats,
    collectives: currentCategory.collectives.map(c => {
      const { stats, ...rest } = c;
      return {
        ...rest,
        contributors: stats?.contributors ?? 0,
        contributions: stats?.contributions ?? 0,
        raised: stats?.raised ?? 0,
        spent: stats?.spent ?? 0,
      };
    }),
  };
}
