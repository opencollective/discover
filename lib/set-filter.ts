import { Filter } from '../components/Dashboard';

import { getSlugAndTimePeriodFromParams, getStaticParamsArray } from './get-static-params';

export const pushFilterToRouter = (filter: Filter, router) => {
  let shallow = true;

  let { params, tag, location, locationType } = router.query;

  if (filter.timePeriod) {
    shallow = false;
    const { hostSlug } = getSlugAndTimePeriodFromParams(params);
    params = getStaticParamsArray({ hostSlug, timePeriod: filter.timePeriod });
  }

  if (filter.tag) {
    tag = filter.tag !== 'ALL' && tag !== filter.tag ? filter.tag : null;
  }

  if (filter.location) {
    location = filter.location.value;
    locationType = filter.location.type;
  }

  router.push(
    {
      pathname: '[[...params]]',
      query: { params, ...(location && { location }), ...(locationType && { locationType }), ...(tag && { tag }) },
    },
    null,
    {
      shallow,
      scroll: false,
    },
  );
};
