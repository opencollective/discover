import countriesData from './data/countries.json';

type LocationOption = {
  type: string;
  value: string;
  label?: string;
  count: number;
  country?: string;
  region?: string;
};

export default function getFilterOptions(collectives) {
  const foundLocations: {
    regions: { [key: string]: LocationOption };
    countries: { [key: string]: LocationOption };
    states: { [key: string]: LocationOption };
    cities: { [key: string]: LocationOption };
  } = {
    regions: {},
    countries: {},
    states: {},
    cities: {},
  };
  collectives.forEach(c => {
    if (c.location) {
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
          type: 'country',
          value: c.location.countryCode,
          region: c.location.region,
          count: (foundLocations.countries[c.location.countryCode]?.count || 0) + 1,
        };
      }
      if (c.location.stateCode) {
        foundLocations.states[c.location.stateCode] = {
          type: 'state',
          value: c.location.stateCode,
          count: (foundLocations.states[c.location.stateCode]?.count || 0) + 1,
        };
      }
      if (c.location.city) {
        foundLocations.cities[c.location.city] = {
          type: 'city',
          value: c.location.city,
          label: c.location.city,
          count: (foundLocations.cities[c.location.city]?.count || 0) + 1,
          country: c.location.countryCode,
          region: c.location.region,
        };
      }
    }
  });

  const regions = Object.values(foundLocations.regions).sort((a, b) => b.count - a.count);

  const countries = Object.values(foundLocations.countries)
    .map(c => {
      const country = countriesData.find(c2 => c2.code === c.value);
      return { ...c, label: country.name, region: country.region };
    })
    .sort((a, b) => b.count - a.count);

  const cities = Object.values(foundLocations.cities).sort((a, b) => b.count - a.count);

  return [
    ...regions,
    ...countries,
    ...cities,
    { type: 'other', value: 'online', label: 'Online' },
    { type: 'other', value: 'global', label: 'Global' },
  ];
}
