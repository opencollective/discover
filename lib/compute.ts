import filterLocation from './location/filterLocation';
import getFilterOptions from './location/getFilterOptions';
import { computeStats, computeTimeSeries } from './computeData';

export function compute({ filter: { tag, location, timePeriod }, categories, allCollectives }) {
  const locationFilteredCollectives = filterLocation(allCollectives, location);
  const categoriesWithCollectives = categories.map(category => {
    const collectivesInCategory = locationFilteredCollectives.filter(
      collective => category.tag === 'ALL' || collective.categoryTags?.includes(category.tag),
    );
    return {
      ...category,
      collectives: collectivesInCategory,
      count: collectivesInCategory.length,
    };
  });

  const currentCategory = categoriesWithCollectives.find(category =>
    tag ? category.tag === tag : category.tag === 'ALL',
  );

  const timeSeries = computeTimeSeries(categoriesWithCollectives.filter(c => tag === 'ALL' || c.tag === tag));

  const stats = computeStats(currentCategory?.collectives);
  const locationOptions = getFilterOptions(allCollectives);

  return {
    series: timeSeries[timePeriod],
    stats: stats?.[timePeriod],
    locationOptions,
    categories: categoriesWithCollectives.map(c => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { collectives, ...rest } = c;
      return rest;
    }),
    collectives: currentCategory.collectives.map(c => {
      const { stats, ...rest } = c;
      return {
        ...rest,
        contributors: stats?.[timePeriod].contributors ?? 0,
        raised: stats?.[timePeriod].raised ?? 0,
        spent: stats?.[timePeriod].spent ?? 0,
        percentDisbursed: stats?.[timePeriod].percentDisbursed ?? null,
      };
    }),
  };
}
