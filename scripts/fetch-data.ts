import fs from 'fs';
import path from 'path';

import Bottleneck from 'bottleneck';
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

import { getAllCollectiveStats } from '../utils/stats';

dayjs.extend(dayjsPluginUTC);
dayjs.extend(dayjsPluginIsoWeek);

const apolloClient = initializeApollo({ fetch: nodeFetch });

const hasValidStats = account =>
  account.ALL?.totalAmountReceivedTimeSeries &&
  account.PAST_YEAR?.totalAmountReceivedTimeSeries &&
  account.PAST_QUARTER?.totalAmountReceivedTimeSeries;

// Rate limiter: 60 requests per minute
const limiter = new Bottleneck({
  reservoir: 60,
  reservoirRefreshAmount: 60,
  reservoirRefreshInterval: 60 * 1000, // 1 minute
  maxConcurrent: 5,
});

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function graphqlRequest(query, variables: any = {}): Promise<{ data: any; elapsed: string }> {
  const requestId = variables.slug || variables.offset || 'unknown';
  return limiter.schedule(async () => {
    const maxRetries = 5;
    const requestStart = Date.now();

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const attemptStart = Date.now();
      try {
        const { data } = await apolloClient.query({ query, variables });
        const elapsed = ((Date.now() - requestStart) / 1000).toFixed(2);
        return { data, elapsed };
      } catch (error) {
        const elapsed = ((Date.now() - attemptStart) / 1000).toFixed(2);
        const is429 = error.message?.includes('429');
        const statusCode = error.networkError?.statusCode || error.statusCode;
        const bodyText = error.networkError?.bodyText || error.bodyText;
        console.error(`[${requestId}] Attempt ${attempt}/${maxRetries} failed after ${elapsed}s:`, error.message);
        console.error(`[${requestId}] Variables:`, JSON.stringify(variables));
        if (statusCode) {
          console.error(`[${requestId}] Status code: ${statusCode}`);
        }
        if (bodyText) {
          console.error(`[${requestId}] Response body: ${bodyText.substring(0, 500)}`);
        }
        if (attempt < maxRetries) {
          // Exponential backoff, longer for rate limit errors
          const backoff = is429 ? Math.pow(2, attempt) * 1000 : attempt * 500;
          console.log(`[${requestId}] Retrying in ${backoff}ms...`);
          await sleep(backoff);
        }
      }
    }

    throw new Error(`Failed to fetch data after multiple retries (${requestId})`);
  });
}

async function fetchDataForPage(host) {
  const { slug, hostSlugs, currency } = host;
  const quarterFrom = dayjs.utc().subtract(12, 'week').startOf('isoWeek').toISOString();
  const quarterTo = dayjs.utc().subtract(1, 'week').endOf('isoWeek').toISOString();
  const yearFrom = dayjs.utc().subtract(12, 'month').startOf('month').toISOString();
  const yearTo = dayjs.utc().subtract(1, 'month').endOf('month').toISOString();

  const pageSize = 10;
  const baseVariables = {
    host: hostSlugs ? hostSlugs.map(s => ({ slug: s })) : { slug },
    currency,
    quarterFrom,
    quarterTo,
    yearFrom,
    yearTo,
  };

  // First request to get total count
  const { data: firstData } = await graphqlRequest(accountsQuery, { ...baseVariables, offset: 0, limit: pageSize });
  const totalCount = firstData.accounts.totalCount;

  if (totalCount <= pageSize) {
    return firstData;
  }

  // Calculate pages needed (excluding first page already fetched)
  const remainingPages = Math.ceil((totalCount - pageSize) / pageSize);
  const offsets = Array.from({ length: remainingPages }, (_, i) => (i + 1) * pageSize);

  console.log(`Fetching ${totalCount} accounts in ${remainingPages + 1} pages (page size: ${pageSize})`);

  let fetchedPages = 0;
  const fetchPage = async (offset: number) => {
    const { data, elapsed } = await graphqlRequest(accountsQuery, { ...baseVariables, offset, limit: pageSize });
    fetchedPages++;
    console.log(
      `Page ${fetchedPages}/${remainingPages}: offset ${offset}, fetched ${data.accounts.nodes.length} in ${elapsed}s`,
    );
    return data.accounts.nodes;
  };

  // Fetch all remaining pages concurrently with rate limiting
  const startTime = Date.now();
  const pageResults = await Promise.all(offsets.map(fetchPage));
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  // Merge all nodes
  const allNodes = [firstData.accounts.nodes, ...pageResults].flat();
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
  const startTime = Date.now();

  const results = await Promise.all(
    slugsToFetch.map(async slug => {
      const result = await fetchAccount(slug);
      completed++;
      if (completed % 10 === 0 || completed === total) {
        const elapsed = (Date.now() - startTime) / 1000;
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
