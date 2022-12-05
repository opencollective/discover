import countriesData from './countries.json';

type LocationOption = {
  type: string;
  value: string;
  label?: string;
  count: number;
};
export default function getFilterOptions(collectives) {
  const foundLocations: {
    regions: { [key: string]: LocationOption };
    countries: { [key: string]: LocationOption };
    cities: { [key: string]: LocationOption };
  } = {
    regions: {},
    countries: {},
    cities: {},
  };
  collectives.forEach(c => {
    if (c.location.region) {
      foundLocations.regions[c.location.region] = {
        type: 'region',
        value: c.location.region,
        label: c.location.region,
        count: (foundLocations.regions[c.location.region]?.count || 0) + 1,
      };
    }
    if (c.location.countryCode) {
      foundLocations.countries[c.location.countryCode] = {
        type: 'countryCode',
        value: c.location.countryCode,
        count: (foundLocations.countries[c.location.countryCode]?.count || 0) + 1,
      };
    }
    if (c.location.city) {
      foundLocations.cities[c.location.city] = {
        type: 'city',
        value: c.location.city,
        label: c.location.city,
        count: (foundLocations.cities[c.location.city]?.count || 0) + 1,
      };
    }
  });

  const regions = Object.values(foundLocations.regions).sort((a, b) => a.label.localeCompare(b.label));

  const countries = Object.values(foundLocations.countries).map(c => {
    const country = countriesData.find(c2 => c2.code === c.value);
    return { ...c, label: country.code === 'US' ? 'USA' : country.name, region: country.region };
  });

  const topCities = Object.values(foundLocations.cities)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // add top cities with hr below
  const options = [...topCities, { hr: true }];

  // for each region
  regions.forEach(region => {
    // add the region to the options
    options.push(region);
    // add the countries in that region to the options
    countries
      .filter(country => {
        return country.region === region.value;
      })
      .sort((a, b) => a.label.localeCompare(b.label))
      .forEach(country => {
        options.push(country);
      });
  });

  return [{ value: '', label: 'All locations', count: collectives.length }, ...options];
}
