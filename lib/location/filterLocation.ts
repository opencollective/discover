export default function filterLocation(collectives, locationFilter) {
  const filter = JSON.parse(locationFilter);
  if (filter.value === '') {
    return collectives;
  }
  return collectives.filter(collective => {
    const { region, domesticRegion, countryCode } = collective.location;

    if (filter.type === 'region') {
      return region === filter.value;
    } else if (filter.type === 'domesticRegion') {
      return domesticRegion === filter.value;
    } else if (filter.type === 'countryCode') {
      return countryCode === filter.value;
    }
  });
}
