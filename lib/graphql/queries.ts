import { gql } from '@apollo/client';

export const accountsQuery = gql`
  query SearchAccounts(
    $host: [AccountReferenceInput]
    $quarterFrom: DateTime
    $quarterTo: DateTime
    $yearFrom: DateTime
    $yearTo: DateTime
    $currency: Currency
    $limit: Int
    $offset: Int
  ) {
    accounts(type: [COLLECTIVE, FUND], limit: $limit, offset: $offset, host: $host) {
      totalCount
      offset
      limit
      nodes {
        name
        slug
        imageUrl
        tags
        location {
          country
        }
        ... on AccountWithHost {
          host {
            slug
            name
          }
        }

        ALL: stats {
          contributorsCount(includeChildren: true)
          totalAmountSpent(net: true, includeChildren: true, currency: $currency) {
            valueInCents
          }
          totalAmountReceivedTimeSeries(net: true, timeUnit: YEAR, includeChildren: true, currency: $currency) {
            timeUnit
            nodes {
              date
              amount {
                valueInCents
              }
            }
          }
        }

        PAST_YEAR: stats {
          contributorsCount(includeChildren: true, dateFrom: $yearFrom, dateTo: $yearTo)
          totalAmountSpent(
            net: true
            includeChildren: true
            dateFrom: $yearFrom
            dateTo: $yearTo
            currency: $currency
          ) {
            valueInCents
          }
          totalAmountReceivedTimeSeries(
            net: true
            dateFrom: $yearFrom
            dateTo: $yearTo
            timeUnit: MONTH
            includeChildren: true
            currency: $currency
          ) {
            timeUnit
            nodes {
              date
              amount {
                valueInCents
              }
            }
          }
        }

        PAST_QUARTER: stats {
          contributorsCount(includeChildren: true, dateFrom: $quarterFrom, dateTo: $quarterTo)
          totalAmountSpent(
            net: true
            includeChildren: true
            dateFrom: $quarterFrom
            dateTo: $quarterTo
            currency: $currency
          ) {
            valueInCents
          }
          totalAmountReceivedTimeSeries(
            net: true
            dateFrom: $quarterFrom
            dateTo: $quarterTo
            timeUnit: WEEK
            includeChildren: true
            currency: $currency
          ) {
            timeUnit
            nodes {
              date
              amount {
                valueInCents
              }
            }
          }
        }
      }
    }
  }
`;

export const totalCountQuery = gql`
  query {
    accounts(type: [COLLECTIVE, FUND], limit: 2) {
      totalCount
    }
  }
`;
