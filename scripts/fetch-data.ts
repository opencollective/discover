process.env.NEXT_PUBLIC_OPENCOLLECTIVE_API_URL = 'http://localhost:3060';

import fs from 'fs';
import path from 'path';

import dayjs from 'dayjs';
import nodeFetch from 'node-fetch';
import dayjsPluginUTC from 'dayjs/plugin/utc';
import dayjsPluginIsoWeek from 'dayjs/plugin/isoWeek';

import { accountsQuery } from '../lib/graphql/queries';
import { initializeApollo } from '../lib/apollo-client';

dayjs.extend(dayjsPluginUTC);
dayjs.extend(dayjsPluginIsoWeek);

const apolloClient = initializeApollo({ fetch: nodeFetch });

function graphqlRequest(query, variables = {}) {
  return apolloClient.query({
    query,
    variables,
  });
}

async function run() {
  const hostSlug = 'foundation';

  const quarterAgo = dayjs.utc().subtract(12, 'week').startOf('isoWeek').toISOString();
  const yearAgo = dayjs.utc().subtract(12, 'month').startOf('month').toISOString();

  const variables = { hostSlug: 'foundation', quarterAgo, yearAgo, offset: 0, limit: 100 };

  let result = await graphqlRequest(accountsQuery, variables);

  if (result.data.accounts.totalCount > result.data.accounts.limit) {
    let nodes = [...result.data.accounts.nodes];
    do {
      variables.offset += result.data.accounts.limit;
      console.log(`Paginating with offset ${variables.offset}`);

      result = await graphqlRequest(accountsQuery, variables);
      nodes = [...nodes, result.data.accounts.nodes];
    } while (result.data.accounts.totalCount > result.data.accounts.limit + result.data.accounts.offset);

    result = {
      data: {
        accounts: {
          ...result.data.accounts,
          offset: 0,
          limit: result.data.accounts.totalCount,
          nodes,
        },
      },
    };
  }

  if (result.data) {
    const filename = path.join(__dirname, '..', '_dump', `${hostSlug}.json`);

    fs.writeFile(filename, JSON.stringify(result.data, null, 2), error => {
      if (error) {
        throw error;
      }
    });
  }
}

run();
