import { gql } from '@apollo/client';

export const accountsQuery = gql`
  query SearchAccounts(
    $host: [AccountReferenceInput]
    $quarterAgo: DateTime
    $yearAgo: DateTime
    $currency: Currency
    $limit: Int
    $offset: Int
  ) {
    accounts(type: [COLLECTIVE, FUND], limit: $limit, offset: $offset, host: $host) {
      totalCount
      offset
      limit
      nodes {
        id
        name
        slug
        createdAt
        description
        imageUrl(height: 100, format: png)
        tags

        ALL_stats: stats {
          contributorsCount(includeChildren: true)
          contributionsCount(includeChildren: true)

          totalAmountSpent(includeChildren: true, currency: $currency) {
            valueInCents
            currency
          }

          totalNetAmountReceivedTimeSeries(timeUnit: YEAR, includeChildren: true, currency: $currency) {
            timeUnit
            nodes {
              date
              amount {
                valueInCents
                currency
              }
            }
          }
        }

        PAST_YEAR_stats: stats {
          contributorsCount(includeChildren: true, dateFrom: $yearAgo)
          contributionsCount(includeChildren: true, dateFrom: $yearAgo)

          totalAmountSpent(includeChildren: true, dateFrom: $yearAgo, currency: $currency) {
            valueInCents
            currency
          }
          totalNetAmountReceivedTimeSeries(
            dateFrom: $yearAgo
            timeUnit: MONTH
            includeChildren: true
            currency: $currency
          ) {
            timeUnit
            nodes {
              date
              amount {
                valueInCents
                currency
              }
            }
          }
        }

        PAST_QUARTER_stats: stats {
          contributorsCount(includeChildren: true, dateFrom: $quarterAgo)
          contributionsCount(includeChildren: true, dateFrom: $quarterAgo)

          totalAmountSpent(includeChildren: true, dateFrom: $quarterAgo, currency: $currency) {
            valueInCents
            currency
          }

          totalNetAmountReceivedTimeSeries(
            dateFrom: $quarterAgo
            timeUnit: WEEK
            includeChildren: true
            currency: $currency
          ) {
            timeUnit
            nodes {
              date
              amount {
                valueInCents
                currency
              }
            }
          }
        }
      }
    }
  }
`;
