import dayjs from 'dayjs';
import dayjsPluginIsoWeek from 'dayjs/plugin/isoWeek';
import dayjsPluginUTC from 'dayjs/plugin/utc';

dayjs.extend(dayjsPluginUTC);
dayjs.extend(dayjsPluginIsoWeek);

// Periods only include complete months/weeks, so "current year" is the year of the last complete month
// (in January, it is the full previous year)
export const getCurrentYear = () => dayjs.utc().subtract(1, 'month').year();

export const getDateRanges = () => {
  const yearTo = dayjs.utc().subtract(1, 'month').endOf('month');
  return {
    quarterFrom: dayjs.utc().subtract(12, 'week').startOf('isoWeek').toISOString(),
    quarterTo: dayjs.utc().subtract(1, 'week').endOf('isoWeek').toISOString(),
    yearFrom: dayjs.utc().subtract(12, 'month').startOf('month').toISOString(),
    yearTo: yearTo.toISOString(),
    currentYearFrom: yearTo.startOf('year').toISOString(),
    currentYearTo: yearTo.toISOString(),
  };
};
