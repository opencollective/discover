import React from 'react';
import styled from 'styled-components';

import { formatCurrency } from '@opencollective/frontend-components/lib/currency-utils';

const List = styled.ul`
  list-style: none;
  padding: 0;
  background: white;
  padding: 16px;
  border-radius: 16px;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
`;

const Avatar = styled.img`
  border-radius: 8px;
  object-fit: cover;
`;

const Collective = styled.a`
  margin-bottom: 8px;
  display: flex !important;
  align-items: center;
  justify-content: space-between;
  text-decoration: none;
  color: #333;
  font-weight: 500;
  padding: 8px;
  padding-right: 16px;
  border-radius: 8px;
  :hover {
    background: #f7f8fa;
    div.name {
      text-decoration: underline;
    }
  }
  gap: 20px;
  div {
    display: flex;
    align-items: center;
    gap: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  div.name,
  div.amount {
    flex-shrink: 0;
  }
  span {
    font-weight: 400;
    text-decoration: none !important;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #999;
  }
`;

interface Props {
  collectives: [any];
  selectedMetric: string;
}

export default function Collectives({ collectives, selectedMetric }: Props) {
  // sort on totalAmountReceived
  const sortedCollectives = [...collectives].sort((a, b) => {
    return selectedMetric === 'TOTAL_RAISED'
      ? b.stats.totalAmountReceived.valueInCents - a.stats.totalAmountReceived.valueInCents
      : b.stats.contributionsCount - a.stats.contributionsCount;
  });
  return (
    <List>
      {sortedCollectives.map(collective => (
        <Collective key={collective.id} href={`https://opencollective.com/${collective.slug}`}>
          <div className="first">
            <div className="name">
              <Avatar
                alt={collective.name}
                src={collective.imageUrl.replace('-staging', '')}
                height={'50px'}
                width={'50px'}
              />{' '}
              {collective.name}{' '}
            </div>
            <span>{collective.description}</span>
          </div>

          <div className="amount">
            {selectedMetric === 'TOTAL_RAISED' ? (
              <React.Fragment>
                {formatCurrency(
                  collective.stats.totalAmountReceived.valueInCents,
                  collective.stats.totalAmountReceived.currency,
                  { locale: 'en-US', precision: 0 },
                )}{' '}
                {collective.stats.totalAmountReceived.currency}
              </React.Fragment>
            ) : (
              <React.Fragment>{collective.stats.contributionsCount}</React.Fragment>
            )}
          </div>
        </Collective>
      ))}
    </List>
  );
}
