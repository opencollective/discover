/* eslint-disable react/jsx-key */
import React, { useEffect } from 'react';
import { Sort } from '@styled-icons/fa-solid/Sort';
import { SortDown } from '@styled-icons/fa-solid/SortDown';
import { FormattedDate } from 'react-intl';
import { useSortBy, useTable } from 'react-table';
import styled from 'styled-components';

import { formatCurrency } from '@opencollective/frontend-components/lib/currency-utils';

import CollectiveModal from './CollectiveModal';

const Table = styled.table`
  padding: 0;
  border-collapse: collapse;
  border-spacing: 0;
  width: 100%;
  thead {
    tr {
      th {
        font-weight: 500;
        color: #333;
        padding: 16px 8px;
        height: 60px;
      }
    }
  }
  tr {
  }
  tbody tr:first-child th:first-child,
  tbody tr:first-child td:first-child {
    border-top-left-radius: 15px;
  }

  tbody tr:first-child th:last-child,
  tbody tr:first-child td:last-child {
    border-top-right-radius: 15px;
  }

  tbody tr:last-child th:first-child,
  tbody tr:last-child td:first-child {
    border-bottom-left-radius: 15px;
  }

  tbody tr:last-child th:last-child,
  tbody tr:last-child td:last-child {
    border-bottom-right-radius: 15px;
  }
  .container {
    background: white;
    border-radius: 16px;
    width: 100%;
  }
  tbody {
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    border-radius: 16px;
    tr.sub {
      border-top: 0 !important;
      background: #f8fafc;
      //color: #666;
      // //font-size: 12px;
      // font-style: italic;
    }
    tr {
      cursor: pointer;
      background: white;
      // not first
      &:not(:first-child) {
        border-top: 1px solid #f1f5f9;
      }
      transition: background 0.1s ease-in-out;
      :hover {
        background: #fbfcfd;
      }
      td {
        padding: 16px;
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
    :hover {
      //text-decoration: underline;
    }
  }
  .last {
    padding-right: 20px;
  }
  .first {
    padding-left: 16px;
  }
  .center {
    text-align: center;
  }
  .right {
    text-align: right;
  }
  .left {
    text-align: left;
  }
`;

export const Avatar = styled.img`
  border-radius: 8px;
  object-fit: cover;
  height: 40px;
  width: 40px;
`;

interface Props {
  collectives: [any];
  collectivesData: object;
  currentMetric: string;
  currentTimePeriod: string;
  currentTag: string;
  locale: string;
}

export default function Collectives({
  collectives,
  collectivesData,
  currentMetric,
  currentTimePeriod,
  currentTag,
  locale,
}: Props) {
  const [collectiveInModal, setCollectiveInModal] = React.useState(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const data = collectives;

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
        Header: 'Name',
        // Header: () => (
        //   <H4 px={''} fontWeight="500" mt={0} mb={0}>
        //     {data.length.toLocaleString(locale)} collectives
        //   </H4>
        // ),
        sortDescFirst: true,

        disableSortBy: false,
        className: 'left first',
      },
      // {
      //   Header: 'Description',
      //   accessor: 'description',
      // },
      {
        Header: 'Created',
        accessor: 'createdAt',
        sortDescFirst: true,
        Cell: ({ row }) => <FormattedDate dateStyle={'medium'} value={row.original.createdAt} />,
        className: 'center',
      },
      {
        Header: 'Contributors',
        accessor: 'contributorsCount',
        sortDescFirst: true,
        Cell: tableProps => tableProps.row.original.contributorsCount.toLocaleString(locale),
        className: 'center',
      },
      {
        Header: 'Admins',
        accessor: 'adminCount',
        sortDescFirst: true,
        // Cell: tableProps => tableProps.row.original.expensesCount.toLocaleString(locale),
        className: 'center',
      },
      {
        Header: 'Expenses',
        accessor: 'expensesCount',
        sortDescFirst: true,
        Cell: tableProps => tableProps.row.original.expensesCount.toLocaleString(locale),
        className: 'center',
      },
      {
        Header: 'Total disbursed',
        accessor: 'totalDisbursed',
        sortDescFirst: true,
        Cell: tableProps =>
          formatCurrency(tableProps.row.original.totalDisbursed, tableProps.row.original.currency, {
            locale: 'en-US',
            precision: 0,
          }),
        className: 'right',
      },
      {
        Header: 'Total raised',
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
        className: 'right last',
      },
    ],
    [currentTag, currentTimePeriod],
  );
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow, toggleSortBy } = useTable(
    { columns, data, disableSortRemove: true },
    useSortBy,
    // useExpanded,
  );

  useEffect(() => {
    if (currentMetric === 'TOTAL_RAISED') {
      toggleSortBy('totalRaised', true, false);
    }
  }, [currentMetric, currentTimePeriod, currentTag]);

  return (
    <React.Fragment>
      <CollectiveModal isOpen={isModalOpen} collective={collectiveInModal} onClose={() => setIsModalOpen(false)} />
      <Table {...getTableProps()} className="">
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th
                  {...column.getHeaderProps([{ className: column.className }, column.getSortByToggleProps()])}
                  style={{
                    color: column.isSorted ? 'black' : '#333',
                    cursor: 'pointer',
                  }}
                >
                  {column.render('Header')}
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
                    ) : column.isSorted ? (
                      <SortDown style={{ transform: 'rotate(180deg)' }} size="16" />
                    ) : (
                      <Sort size="16" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map(row => {
            prepareRow(row);
            return (
              <tr
                key={row.original.id}
                {...row.getRowProps()}
                onClick={() => {
                  setCollectiveInModal(collectivesData[row.original.id]);
                  setIsModalOpen(true);
                }}
              >
                {row.cells.map(cell => {
                  return <td {...cell.getCellProps([{ className: cell.column.className }])}>{cell.render('Cell')}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </Table>
    </React.Fragment>
  );
}
