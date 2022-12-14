import filterLocation from './location/filterLocation';
import getFilterOptions from './location/getFilterOptions';
import { computeStats, computeTimeSeries } from './computeData';

export function compute({ tag, categories, location, timePeriod, allCollectives }) {
  //   const data = await require
  //   const collectives = data.collectives;
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

  //   console.log({ categoriesWithCollectives });

  const currentCategory = categoriesWithCollectives.find(category =>
    tag ? category.tag === tag : category.tag === 'ALL',
  );

  const timeSeries = computeTimeSeries(categoriesWithCollectives);

  //   console.log({ currentCategory, tag });
  //   return {
  //     series: [],
  //     stats: {},
  //     locationOptions: [],
  //     categories: [],
  //     collectives: [],
  //   };
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
