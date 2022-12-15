export function computeStats(collectives) {
  return collectives.reduce(
    (acc, collective) => {
      if (!collective.raised) {
        return acc;
      }
      return {
        collectivesCount: collectives.length,
        raised: acc.raised + collective.raised,
        totalContributions: acc.totalContributions + collective.contributions,
        totalContributors: acc.totalContributors + collective.contributors,
      };
    },
    {
      collectivesCount: 0,
      raised: 0,
      totalContributions: 0,
      totalContributors: 0,
    },
  );
}

export function computeTimeSeries(categoriesWithFilteredData) {
  const categoriesTimeSeries = categoriesWithFilteredData.map(category => {
    const timeSeries = category.collectives.reduce(
      (acc, node) => {
        if (!node.raisedSeries) {
          return acc;
        }
        acc.timeUnit = node.raisedSeries.timeUnit;
        node.raisedSeries.nodes.forEach(node => {
          const key = node.date;
          if (!acc.nodes[key]) {
            acc.nodes[key] = {
              date: node.date,
              amount: 0,
            };
          }
          acc.nodes[key].amount += node.amount;
        });

        return acc;
      },
      { timeUnit: 'YEAR', nodes: {} },
    );

    return {
      label: category.label,
      color: category.color,
      tag: category.tag,
      timeUnit: timeSeries.timeUnit,
      nodes: Object.values(timeSeries.nodes),
    };
  });
  return categoriesTimeSeries;
}
