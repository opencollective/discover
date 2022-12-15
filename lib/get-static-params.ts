const timePeriods = {
  ALL: 'ALL',
  PAST_YEAR: 'PAST_YEAR',
  PAST_QUARTER: 'PAST_QUARTER',
};

export const getSlugAndTimePeriodFromParams = (staticParams: any) => {
  const params = Array.isArray(staticParams) ? staticParams : [staticParams];
  let hostSlug, timePeriod;
  if (timePeriods[params[0]]) {
    hostSlug = null;
    timePeriod = params[0];
  } else {
    hostSlug = params[0];
    timePeriod = timePeriods[params[1]] ?? timePeriods.ALL;
  }
  return { hostSlug, timePeriod };
};

export const getPathNameFromParams = (params: { hostSlug?: string; timePeriod?: string }) => {
  const { hostSlug, timePeriod } = params;
  const hostPart = hostSlug ?? null;
  const timePart = timePeriod !== timePeriods.ALL ? timePeriod : null;
  return `/${[hostPart, timePart].filter(Boolean).join('/')}`;
};

export const getStaticParamsArray = ({ hostSlug, timePeriod }) => {
  const hostPart = hostSlug ?? null;
  const timePart = timePeriod !== timePeriods.ALL ? timePeriod : null;
  return [hostPart, timePart].filter(Boolean);
};
