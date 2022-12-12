export function computeStats(collectives, currency) {
  return collectives.reduce(
    (acc, collective) => {
      if (!collective.stats) {
        return acc;
      }
      return {
        ALL: {
          raised: acc.ALL.raised + collective.stats.ALL.raised,
          totalContributions: acc.ALL.totalContributions + collective.stats.ALL.contributions,
          totalContributors: acc.ALL.totalContributors + collective.stats.ALL.contributors,
        },
        PAST_YEAR: {
          raised: acc.PAST_YEAR.raised + collective.stats.PAST_YEAR.raised,
          totalContributions: acc.PAST_YEAR.totalContributions + collective.stats.PAST_YEAR.contributions,
          totalContributors: acc.PAST_YEAR.totalContributors + collective.stats.PAST_YEAR.contributors,
        },

        PAST_QUARTER: {
          raised: acc.PAST_QUARTER.raised + collective.stats.PAST_QUARTER.raised,
          totalContributions: acc.PAST_QUARTER.totalContributions + collective.stats.PAST_QUARTER.contributions,
          totalContributors: acc.PAST_QUARTER.totalContributors + collective.stats.PAST_QUARTER.contributors,
        },
      };
    },
    {
      ALL: {
        raised: 0,
        totalContributions: 0,
        totalContributors: 0,
      },
      PAST_YEAR: {
        raised: 0,
        totalContributions: 0,
        totalContributors: 0,
      },
      PAST_QUARTER: {
        raised: 0,
        totalContributions: 0,
        totalContributors: 0,
      },
    },
  );
}

export function computeTimeSeries(categoriesWithFilteredData) {
  const categoriesTimeSeries = categoriesWithFilteredData.map(category => {
    const timeSeries = category.collectives.reduce(
      (acc, node) => {
        if (!node.stats) {
          return acc;
        }

        node.stats.ALL.raisedSeries.forEach(timeSeries => {
          const key = timeSeries.date;
          if (!acc.ALL[key]) {
            acc.ALL[key] = {
              date: timeSeries.date,
              amount: 0,
            };
          }
          acc.ALL[key].amount += timeSeries.amount;
        });
        node.stats.PAST_QUARTER.raisedSeries.forEach(timeSeries => {
          const key = timeSeries.date;
          if (!acc.PAST_QUARTER[key]) {
            acc.PAST_QUARTER[key] = {
              date: timeSeries.date,
              amount: 0,
            };
          }
          acc.PAST_QUARTER[key].amount += timeSeries.amount;
        });
        node.stats.PAST_YEAR.raisedSeries.forEach(timeSeries => {
          const key = timeSeries.date;
          if (!acc.PAST_YEAR[key]) {
            acc.PAST_YEAR[key] = {
              date: timeSeries.date,
              amount: 0,
            };
          }
          acc.PAST_YEAR[key].amount += timeSeries.amount;
        });
        return { ...acc };
      },
      { ALL: {}, PAST_QUARTER: {}, PAST_YEAR: {} },
    );

    return {
      ALL: {
        label: category.label,
        color: category.color,
        tag: category.tag,
        timeUnit: 'YEAR',
        nodes: Object.values(timeSeries.ALL),
      },
      PAST_QUARTER: {
        label: category.label,
        color: category.color,
        tag: category.tag,
        timeUnit: 'WEEK',
        nodes: Object.values(timeSeries.PAST_QUARTER),
      },
      PAST_YEAR: {
        label: category.label,
        color: category.color,
        tag: category.tag,
        timeUnit: 'MONTH',
        nodes: Object.values(timeSeries.PAST_YEAR),
      },
    };
  });
  return categoriesTimeSeries.reduce(
    (acc, category) => {
      return {
        ALL: [...acc.ALL, category.ALL],
        PAST_QUARTER: [...acc.PAST_QUARTER, category.PAST_QUARTER],
        PAST_YEAR: [...acc.PAST_YEAR, category.PAST_YEAR],
      };
    },
    { ALL: [], PAST_QUARTER: [], PAST_YEAR: [] },
  );
}
