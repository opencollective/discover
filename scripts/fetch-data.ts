import fs from 'fs';
import path from 'path';

import dayjs from 'dayjs';
import dayjsPluginIsoWeek from 'dayjs/plugin/isoWeek';
import dayjsPluginUTC from 'dayjs/plugin/utc';
import dotenv from 'dotenv';
import nodeFetch from 'node-fetch';

import { additionalCollectiveSlugs } from '../lib/additional-collectives';
import { hosts } from '../lib/hosts';

// Load environment
// eslint-disable-next-line no-process-env
for (const env of ['local', process.env.NODE_ENV || 'development']) {
  const envPath = path.join(__dirname, '..', `.env.${env}`);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

import { initializeApollo } from '../lib/apollo-client';
import { accountBySlugQuery, accountsQuery, totalCountQuery } from '../lib/graphql/queries';

import { rateLimiter } from '../utils/rate-limiter';
import { getAllCollectiveStats } from '../utils/stats';

dayjs.extend(dayjsPluginUTC);
dayjs.extend(dayjsPluginIsoWeek);

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Wrap fetch to track rate limit headers
const fetchWithRateLimit = async (url, options) => {
  const response = await nodeFetch(url, options);
  rateLimiter.update(response.headers);
  return response;
};

const apolloClient = initializeApollo({ fetch: fetchWithRateLimit });

const hasValidStats = account =>
  account.ALL?.totalAmountReceivedTimeSeries &&
  account.PAST_YEAR?.totalAmountReceivedTimeSeries &&
  account.PAST_QUARTER?.totalAmountReceivedTimeSeries;

async function graphqlRequest(query, variables: any = {}): Promise<{ data: any; elapsed: string }> {
  await rateLimiter.waitIfNeeded();

  const maxRetries = 5;
  const requestStart = Date.now();

  try {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const attemptStart = Date.now();
      try {
        const { data } = await apolloClient.query({ query, variables });
        const elapsed = ((Date.now() - requestStart) / 1000).toFixed(2);
        return { data, elapsed };
      } catch (error) {
        const elapsed = ((Date.now() - attemptStart) / 1000).toFixed(2);
        const statusCode = error.networkError?.statusCode || error.statusCode;
        const is429 = statusCode === 429 || error.message?.includes('429');
        const bodyText = error.networkError?.bodyText || error.bodyText;
        const headers = error.networkError?.response?.headers;
        console.error(`Request failed after ${elapsed}s:`, error.message);
        console.error(`Variables:`, JSON.stringify(variables));
        if (statusCode) {
          console.error(`Status code: ${statusCode}`);
        }
        if (bodyText) {
          console.error(`Response body: ${bodyText.substring(0, 500)}`);
        }
        if (headers) {
          console.error('Response headers:', Object.fromEntries(headers.entries?.() || []));
        }

        // Retry on 429 (rate limit) and 503 (server overload)
        const is503 = statusCode === 503;
        const shouldRetry = (is429 || is503) && attempt < maxRetries;

        if (shouldRetry) {
          const backoff = is429 ? Math.pow(2, attempt) * 1000 : attempt * 1000;
          console.log(`Retrying in ${backoff}ms (attempt ${attempt}/${maxRetries})...`);
          await sleep(backoff);
        } else {
          throw error;
        }
      }
    }

    throw new Error(`Failed to fetch data after multiple retries`);
  } finally {
    rateLimiter.done();
  }
}

async function fetchBatchWithSplit(baseVariables: any, offset: number, limit: number, depth = 0): Promise<any[]> {
  const indent = '  '.repeat(depth);
  try {
    const { data, elapsed } = await graphqlRequest(accountsQuery, { ...baseVariables, offset, limit });
    console.log(
      `${indent}Fetched offset ${offset}, limit ${limit}: ${data.accounts.nodes.length} accounts in ${elapsed}s`,
    );
    return data.accounts.nodes;
  } catch (error) {
    if (limit <= 1) {
      console.error(`${indent}Failed to fetch single account at offset ${offset}, skipping: ${error.message}`);
      return [];
    }
    // Split the batch in half and retry each half
    const half = Math.ceil(limit / 2);
    console.log(
      `${indent}Splitting batch at offset ${offset} (limit ${limit}) into two halves of ${half} and ${limit - half}`,
    );
    const [firstHalf, secondHalf] = await Promise.all([
      fetchBatchWithSplit(baseVariables, offset, half, depth + 1),
      fetchBatchWithSplit(baseVariables, offset + half, limit - half, depth + 1),
    ]);
    return [...firstHalf, ...secondHalf];
  }
}

async function fetchDataForPage(host) {
  const { slug, hostSlugs, currency } = host;
  const quarterFrom = dayjs.utc().subtract(12, 'week').startOf('isoWeek').toISOString();
  const quarterTo = dayjs.utc().subtract(1, 'week').endOf('isoWeek').toISOString();
  const yearFrom = dayjs.utc().subtract(12, 'month').startOf('month').toISOString();
  const yearTo = dayjs.utc().subtract(1, 'month').endOf('month').toISOString();

  const pageSize = 16;
  const baseVariables = {
    host: hostSlugs ? hostSlugs.map(s => ({ slug: s })) : { slug },
    currency,
    quarterFrom,
    quarterTo,
    yearFrom,
    yearTo,
  };

  // First request to get total count and first batch
  const { data: firstData } = await graphqlRequest(accountsQuery, { ...baseVariables, offset: 0, limit: pageSize });
  const totalCount = firstData.accounts.totalCount;

  console.log(`Total accounts to fetch: ${totalCount} (batch size: ${pageSize})`);

  if (totalCount <= pageSize) {
    return firstData;
  }

  // Calculate remaining batches needed
  const remainingCount = totalCount - pageSize;
  const remainingBatches = Math.ceil(remainingCount / pageSize);
  const batches = Array.from({ length: remainingBatches }, (_, i) => ({
    offset: (i + 1) * pageSize,
    limit: Math.min(pageSize, totalCount - (i + 1) * pageSize),
  }));

  console.log(`Fetching ${totalCount} accounts in ${remainingBatches + 1} batches`);

  // Fetch all remaining batches concurrently with rate limiting and split-on-failure
  const startTime = Date.now();
  const batchResults = await Promise.all(
    batches.map(batch => fetchBatchWithSplit(baseVariables, batch.offset, batch.limit)),
  );
  const allNodes = [firstData.accounts.nodes, ...batchResults].flat();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`Total: fetched ${allNodes.length} accounts in ${elapsed}s`);

  return {
    accounts: {
      ...firstData.accounts,
      totalCount,
      offset: 0,
      limit: totalCount,
      nodes: allNodes,
    },
  };
}

async function fetchAdditionalCollectives(currency: string, existingSlugs: Set<string>) {
  const quarterFrom = dayjs.utc().subtract(12, 'week').startOf('isoWeek').toISOString();
  const quarterTo = dayjs.utc().subtract(1, 'week').endOf('isoWeek').toISOString();
  const yearFrom = dayjs.utc().subtract(12, 'month').startOf('month').toISOString();
  const yearTo = dayjs.utc().subtract(1, 'month').endOf('month').toISOString();

  const slugsToFetch = additionalCollectiveSlugs.filter(slug => !existingSlugs.has(slug));

  console.log(
    `Fetching ${slugsToFetch.length} additional collectives (${
      additionalCollectiveSlugs.length - slugsToFetch.length
    } already in host data)`,
  );

  const fetchAccount = async (slug: string) => {
    try {
      const { data } = await graphqlRequest(accountBySlugQuery, {
        slug,
        currency,
        quarterFrom,
        quarterTo,
        yearFrom,
        yearTo,
      });
      return data.account;
    } catch (error) {
      console.error(`Failed to fetch ${slug}:`, error.message);
      return null;
    }
  };

  // Progress tracking
  let completed = 0;
  const total = slugsToFetch.length;

  const results = await Promise.all(
    slugsToFetch.map(async slug => {
      const result = await fetchAccount(slug);
      completed++;
      if (completed % 10 === 0 || completed === total) {
        console.log(`Progress: ${completed}/${total}`);
      }
      return result;
    }),
  );

  // Filter out null results and accounts without proper stats structure
  const collectives = [];
  for (let i = 0; i < results.length; i++) {
    const account = results[i];
    const slug = slugsToFetch[i];
    if (!account) {
      console.warn(`Warning: Account not found: ${slug}`);
    } else if (!hasValidStats(account)) {
      console.warn(`Warning: Account has incomplete stats data: ${slug}`);
    } else {
      collectives.push(account);
    }
  }
  console.log(`Fetched ${collectives.length} valid collectives out of ${total} slugs`);

  return collectives;
}

async function run() {
  // Get total number of collectives on platform
  const {
    data: {
      accounts: { totalCount },
    },
  } = await graphqlRequest(totalCountQuery);

  const directory = path.join(__dirname, '..', '_data');

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }
  const collectiveCounts = {
    platform: totalCount,
  };

  let rootData;

  const rootHost = hosts.find(h => h.root);
  // Get data for each host, including updating the shared.json file with collective counts
  for (const host of hosts) {
    console.log('Get data for', host.name);
    let data;

    if (rootData && rootHost.hostSlugs.includes(host.slug) && rootHost.currency === host.currency) {
      // Can use already fetched data.
      const hostedAccounts = rootData.accounts.nodes.filter(a => a.host?.slug === host.slug);
      data = {
        accounts: {
          totalCount: hostedAccounts.length,
          offset: 0,
          limit: hostedAccounts.length,
          nodes: hostedAccounts,
        },
      };
    } else {
      data = await fetchDataForPage(host);

      // add total stats to collectives, and filter away collectives with no stats data
      const updatedAccounts = {
        ...data.accounts,
        nodes: data.accounts.nodes
          .filter(account => {
            if (!hasValidStats(account)) {
              console.warn(
                `Warning: Account has incomplete stats data: ${
                  account?.slug || account?.name || JSON.stringify(account)
                }`,
              );
              return false;
            }
            return true;
          })
          .map(account => {
            const stats = getAllCollectiveStats(account);
            return {
              ...account,
              stats,
            };
          })
          .filter(account => account.stats),
      };

      data = {
        ...data,
        accounts: updatedAccounts,
      };

      if (host.root) {
        // Fetch additional collectives and merge them into root data
        const existingSlugs = new Set<string>(data.accounts.nodes.map(a => a.slug));
        console.log('Fetching additional collectives...');
        const additionalCollectives = await fetchAdditionalCollectives(host.currency, existingSlugs);

        // Process stats for additional collectives and filter those with no activity
        const processedAdditional = [];
        for (const account of additionalCollectives) {
          const stats = getAllCollectiveStats(account);
          if (stats) {
            processedAdditional.push({ ...account, stats });
          } else {
            console.warn(`Warning: Account has no activity: ${account.slug}`);
          }
        }

        console.log(`Adding ${processedAdditional.length} additional collectives with activity`);

        // Merge additional collectives into root data
        data = {
          ...data,
          accounts: {
            ...data.accounts,
            totalCount: data.accounts.totalCount + processedAdditional.length,
            limit: data.accounts.limit + processedAdditional.length,
            nodes: [...data.accounts.nodes, ...processedAdditional],
          },
        };

        rootData = data;
      }
    }

    if (data) {
      collectiveCounts[host.root ? 'ALL' : host.slug] = data.accounts.nodes.length;

      // write data to file
      const filename = path.join(directory, `${host.root ? 'ALL' : host.slug}.json`);
      console.log('Writing to file', filename);

      fs.writeFile(filename, JSON.stringify(data, null, 2), error => {
        if (error) {
          throw error;
        }
      });
    }
  }

  // write collective count to shared.json
  fs.writeFile(path.join(directory, 'shared.json'), JSON.stringify({ collectiveCounts }), error => {
    if (error) {
      throw error;
    }
  });
}

run();
