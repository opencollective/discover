/* eslint-disable react/jsx-key */
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useTable, useSortBy } from 'react-table';
import { formatCurrency } from '@opencollective/frontend-components/lib/currency-utils';
import { H4 } from '@opencollective/frontend-components/components/Text';

const Table = styled.table`
  margin-top: 16px;
  padding: 0;
  border-collapse: collapse;
  border-spacing: 0;
  width: 100%;
  thead {
    tr {
      th {
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
    tr {
      background: white;
      border-bottom: 1px solid #f1f5f9;
      :hover {
        background: #f7f8fa;
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
    :hover {
      text-decoration: underline;
    }
  }
  .last {
    padding-right: 20px;
  }
  .first {
    padding-left: 16px;
  }
  .right {
    text-align: right;
  }
  .left {
    text-align: left;
  }
`;

const Avatar = styled.img`
  border-radius: 8px;
  object-fit: cover;
`;

interface Props {
  collectives: [any];
  currentMetric: string;
  currentTimePeriod: string;
  currentTag: string;
  locale: string;
}

export default function Collectives({ collectives, currentMetric, currentTimePeriod, currentTag, locale }: Props) {
  const data = React.useMemo(
    () =>
      collectives.map(collective => ({
        id: collective.id,
        name: collective.name,
        slug: collective.slug,
        description: collective.description,
        imageUrl: collective.imageUrl,
        totalRaised: collective.stats.totalAmountReceived.valueInCents,
        currency: collective.stats.totalAmountReceived.currency,
        contributionsCount: collective.stats.contributionsCount,
      })),
    [currentTimePeriod, currentTag],
  );

  const columns = React.useMemo(
    () => [
      {
        accessor: 'name',
        Cell: tableProps => (
          <a href={`https://opencollective.com/${tableProps.row.original.slug}`} target="_blank" className="collective">
            <Avatar
              alt={tableProps.row.original.name}
              src={tableProps.row.original.imageUrl.replace('-staging', '')}
              height={'40px'}
              width={'40px'}
            />
            <span>{tableProps.row.original.name}</span>
          </a>
        ),
        Header: () => (
          <H4 px={''} fontWeight="500" mt={0} mb={0}>
            {data.length.toLocaleString(locale)} collectives
          </H4>
        ),
        disableSortBy: true,
        className: 'left first',
      },
      // {
      //   Header: 'Description',
      //   accessor: 'description',
      // },
      {
        Header: 'Contributions',
        accessor: 'contributionsCount',
        sortDescFirst: true,
        Cell: tableProps => <div className="">{tableProps.row.original.contributionsCount.toLocaleString(locale)}</div>,
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
            })}{' '}
            {tableProps.row.original.currency}
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
  );

  useEffect(() => {
    if (currentMetric === 'TOTAL_RAISED') {
      toggleSortBy('totalRaised', true, false);
    } else if (currentMetric === 'CONTRIBUTIONS') {
      toggleSortBy('contributionsCount', true, false);
    }
  }, [currentMetric, currentTimePeriod, currentTag]);

  return (
    <Table {...getTableProps()} className="">
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              <th {...column.getHeaderProps([{ className: column.className }, column.getSortByToggleProps()])}>
                {column.render('Header')}
                <span>{column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}</span>
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map(row => {
          prepareRow(row);
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map(cell => {
                return <td {...cell.getCellProps([{ className: cell.column.className }])}>{cell.render('Cell')}</td>;
              })}
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
