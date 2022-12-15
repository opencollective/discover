import { NextRouter } from 'next/router';

import { Filter } from '../components/Dashboard';

const getParam = param => (Array.isArray(param) ? param[0] : param);

const getLocationFilterParams = query => {
  const location = getParam(query?.location);
  const locationType = getParam(query?.locationType);
  return location && locationType ? { type: locationType, value: location } : null;
};

export const getFilterFromQuery = (query: NextRouter['query'], initial: Filter): Filter => {
  return {
    slug: getParam(query?.params[0]) ?? initial.slug,
    tag: getParam(query?.tag) ?? initial.tag,
    timePeriod: getParam(query?.params[1]) ?? initial.timePeriod,
    location: getLocationFilterParams(query) ?? initial.location,
  };
};
