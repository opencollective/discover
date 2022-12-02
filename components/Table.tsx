import React, { useEffect } from 'react';
import { ChevronLeft } from '@styled-icons/fa-solid/ChevronLeft';
import { ChevronRight } from '@styled-icons/fa-solid/ChevronRight';
import { SortDown } from '@styled-icons/fa-solid/SortDown';
import { useFilters, usePagination, useSortBy, useTable } from 'react-table';
import styled from 'styled-components';

import getFilterOptions from '../lib/location/getFilterOptions';
import { formatCurrency } from '@opencollective/frontend-components/lib/currency-utils';

import LocationTag from './LocationTag';

const Table = styled.table`
  padding: 0;
  border-collapse: collapse;
  border-spacing: 0;
  width: 100%;
  thead {
    tr {
      th {
        font-weight: 700;
        color: #374151;
        height: 60px;
        text-transform: uppercase;
        font-size: 12px;
        letter-spacing: 0.06em;
        padding-bottom: 16px;
      }
    }
  }

  .container {
    width: 100%;
  }
  tbody {
    tr {
      cursor: pointer;
      border-top: 1px solid #f1f5f9;

      transition: background 0.1s ease-in-out;
      :hover {
        background: #fbfcfd;
      }
    }
  }
  .collective {
    display: flex;
    align-items: center;
    grid-gap: 16px;
    color: #333;
    font-weight: 500;
    text-decoration: none;
    max-width: 350px;
    span {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
`;

export const Avatar = styled.img`
  border-radius: 8px;
  object-fit: cover;
  height: 40px;
  width: 40px;
`;

function LocationFilter({ column: { filterValue, setFilter, preFilteredRows } }) {
  const options = React.useMemo(() => getFilterOptions(preFilteredRows), [preFilteredRows]);

  return (
    <select
      value={filterValue}
      className="mt-1 bg-gray-50 p-1"
      onChange={e => {
        setFilter(e.target.value || undefined);
      }}
    >
      <option value="">All</option>
      {options.map(option => (
        <option key={option.label} value={JSON.stringify(option)}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function filterLocation(rows, id, filterValue) {
  const filter = JSON.parse(filterValue);
  if (filter.value === '') {
    return rows;
  }
  return rows.filter(row => {
    const { region, domesticRegion, countryCode } = row.original.location;

    if (filter.type === 'region') {
      return region === filter.value;
    } else if (filter.type === 'domesticRegion') {
      return domesticRegion === filter.value;
    } else if (filter.type === 'countryCode') {
      return countryCode === filter.value;
    }
  });
}

interface Props {
  collectives: [any];
  currentTimePeriod: string;
  currentTag: string;
  currentLocationFilter: string;
  locale: string;
  openCollectiveModal: (slug: string) => void;
}

export default function Collectives({
  collectives,
  currentTimePeriod,
  currentTag,
  locale,
  currentLocationFilter,
  openCollectiveModal,
}: Props) {
  const data = React.useMemo(
    () =>
      collectives.map(c => ({
        ...c,
        contributorsCount: c.stats[currentTimePeriod].contributors,
        totalRaised: c.stats[currentTimePeriod].totalNetRaised,
        totalSpent: c.stats[currentTimePeriod].totalSpent,
        currency: 'USD',
        percentDisbursed: c.stats[currentTimePeriod].percentDisbursed,
      })),
    [currentTag, currentTimePeriod],
  );
  // console.log({ data, collectives });
  const columns = React.useMemo(
    () => [
      {
        accessor: 'name',
        Cell: ({ row }) => (
          <div className="collective">
            <Avatar alt={row.original.name} src={row.original.imageUrl} height={'40px'} width={'40px'} />
            <span>{row.original.name}</span>
          </div>
        ),
        Header: 'Collective',
        sortDescFirst: true,
        disableSortBy: true,
        className: 'max-w-[220px] text-left pl-4 lg:pl-8 pr-2 py-4',
        disableFilters: true,
      },
      {
        accessor: 'location',
        Cell: ({ row }) =>
          row.original.location.label && (
            <div className="flex justify-start">
              <LocationTag>{row.original.location.label}</LocationTag>
            </div>
          ),
        Header: 'Location',
        Filter: LocationFilter,
        filter: filterLocation,
        disableSortBy: true,
        className: 'max-w-[150px] text-left overflow-hidden px-2 py-4',
      },
      // {
      //   Header: 'Created',
      //   accessor: 'createdAt',
      //   sortDescFirst: true,
      //   Cell: ({ row }) => new Date(row.original.createdAt).getUTCFullYear(),
      //   className: 'center',
      //   disableFilters: true,
      // },
      {
        Header: 'Contributors',
        accessor: 'contributorsCount',
        sortDescFirst: true,
        Cell: tableProps => tableProps.row.original.contributorsCount.toLocaleString(locale),
        className: 'text-center px-2 py-4',
        disableFilters: true,
      },
      {
        Header: '% disbursed',
        accessor: 'percentDisbursed',
        sortDescFirst: true,
        Cell: ({ row }) => {
          const percentDisbursed = parseFloat(row.original.percentDisbursed);
          return isNaN(percentDisbursed) ? 'n/a' : `${percentDisbursed.toFixed(1)}%`;
        },
        className: 'text-center px-2 py-4',
        disableFilters: true,
      },
      {
        Header: 'Spent',
        accessor: 'totalSpent',
        Cell: tableProps => (
          <div className="">
            {formatCurrency(tableProps.row.original.totalSpent, tableProps.row.original.currency, {
              locale: 'en-US',
              precision: 0,
            })}
          </div>
        ),
        sortDescFirst: true,
        className: 'text-right pr-4 lg:pr-8 pl-2 py-4',
        disableFilters: true,
      },
      {
        Header: 'Raised',
        accessor: 'totalRaised',
        Cell: tableProps => (
          <div className="">
            {formatCurrency(tableProps.row.original.totalRaised, tableProps.row.original.currency, {
              locale: 'en-US',
              precision: 0,
            })}
          </div>
        ),
        sortDescFirst: true,
        className: 'text-right pr-4 lg:pr-8 pl-2 py-4',
        disableFilters: true,
      },
    ],
    [currentTag, currentTimePeriod],
  );
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    gotoPage,
    nextPage,
    previousPage,
    setFilter,
    state: { pageIndex },
  } = useTable(
    {
      columns,
      data,
      disableSortRemove: true,
      initialState: {
        sortBy: [
          {
            id: 'totalRaised',
            desc: true,
          },
        ],
      },
    },
    useFilters,
    useSortBy,
    usePagination,
  );

  // useEffect(() => {
  //   if (currentMetric === 'TOTAL_RAISED') {
  //     toggleSortBy('totalRaised', true, false);
  //   }
  // }, [currentMetric, currentTimePeriod, currentTag]);

  // Listen for input changes outside
  useEffect(() => {
    // This will now use our custom filter for age
    setFilter('location', currentLocationFilter);
  }, [currentLocationFilter]);

  return (
    <React.Fragment>
      <div className="overflow-auto">
        <Table {...getTableProps()} className="">
          <thead>
            {headerGroups.map(headerGroup => {
              const { key, ...restHeaderGroupProps } = headerGroup.getHeaderGroupProps();
              return (
                <tr key={key} {...restHeaderGroupProps}>
                  {headerGroup.headers.map(column => {
                    const { key, ...restColumn } = column.getHeaderProps([
                      { className: column.className },
                      column.getSortByToggleProps(),
                    ]);
                    return (
                      <th
                        key={key}
                        {...restColumn}
                        style={{
                          color: column.isSorted ? 'black' : '#374151',
                          cursor: column.canSort ? 'pointer' : 'default',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {column.render('Header')}{' '}
                        {column.canSort && column.isSorted && (
                          <span
                            style={{
                              display: 'inline-block',
                              verticalAlign: 'top',
                              marginLeft: '4px',
                              opacity: column.isSorted ? '100%' : '25%',
                            }}
                          >
                            {column.isSortedDesc ? (
                              <SortDown size="16" />
                            ) : (
                              <SortDown style={{ transform: 'rotate(180deg)' }} size="16" />
                            )}
                          </span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              );
            })}
          </thead>
          <tbody {...getTableBodyProps()}>
            {page.map(row => {
              prepareRow(row);
              const { key, ...restRowProps } = row.getRowProps();
              return (
                <tr
                  key={key}
                  {...restRowProps}
                  onClick={() => {
                    openCollectiveModal(row.original.slug);
                  }}
                >
                  {row.cells.map(cell => {
                    const { key, ...restCellProps } = cell.getCellProps([{ className: cell.column.className }]);
                    return (
                      <td key={key} {...restCellProps}>
                        {cell.render('Cell')}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
      <div className="flex items-center gap-4 px-10 text-sm text-gray-700">
        <span>
          Page{' '}
          <input
            type="number"
            className="inline-block w-10 rounded border text-center"
            value={pageIndex + 1}
            onChange={e => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              gotoPage(page);
            }}
          />{' '}
          of {pageOptions.length}
        </span>

        <div>
          <button
            onClick={() => previousPage()}
            disabled={!canPreviousPage}
            className="h-10 w-10 rounded-full p-2 hover:bg-gray-100 hover:text-black"
          >
            <ChevronLeft size="12" />
          </button>{' '}
          <button
            onClick={() => nextPage()}
            disabled={!canNextPage}
            className="h-10 w-10 rounded-full p-2 hover:bg-gray-100 hover:text-black"
          >
            <ChevronRight size="12" />
          </button>
        </div>
      </div>
    </React.Fragment>
  );
}
