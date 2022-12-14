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
        name
        slug
        imageUrl
        tags

        ALL_stats: stats {
          contributorsCount(includeChildren: true)
          contributionsCount(includeChildren: true)

          totalAmountSpent(net: false, includeChildren: true, currency: $currency) {
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

        PAST_YEAR_stats: stats {
          contributorsCount(includeChildren: true, dateFrom: $yearAgo)
          contributionsCount(includeChildren: true, dateFrom: $yearAgo)

          totalAmountSpent(net: false, includeChildren: true, dateFrom: $yearAgo, currency: $currency) {
            valueInCents
          }
          totalAmountReceivedTimeSeries(
            net: true
            dateFrom: $yearAgo
            timeUnit: MONTH
            includeChildren: true
            currency: $currency
          ) {
            nodes {
              date
              amount {
                valueInCents
              }
            }
          }
        }

        PAST_QUARTER_stats: stats {
          contributorsCount(includeChildren: true, dateFrom: $quarterAgo)
          contributionsCount(includeChildren: true, dateFrom: $quarterAgo)

          totalAmountSpent(net: false, includeChildren: true, dateFrom: $quarterAgo, currency: $currency) {
            valueInCents
          }

          totalAmountReceivedTimeSeries(
            net: true
            dateFrom: $quarterAgo
            timeUnit: WEEK
            includeChildren: true
            currency: $currency
          ) {
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
