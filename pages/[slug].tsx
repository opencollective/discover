import React from 'react';
import type { GetStaticProps } from 'next';
import Head from 'next/head';

import { compute } from '../lib/compute';
import { hosts } from '../lib/hosts';
import { getAllPosts, markdownToHtml } from '../lib/markdown';

import Dashboard, { Filter } from '../components/Dashboard';
import Layout from '../components/Layout';

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const startTime = Date.now();
  const hostSlug: string = params ? (Array.isArray(params.slug) ? params.slug[0] : params.slug) : null;
  const host = hosts.find(h => {
    if (!hostSlug) {
      return h.slug === '';
    }
    return h.slug === hostSlug;
  });
  if (!host) {
    return {
      notFound: true,
    };
  }

  const { currency, startYear } = host;
  const { collectives, categories } = await require(`../_dump/${hostSlug ?? 'ALL'}.json`);

  const allStories = getAllPosts(hostSlug, ['title', 'content', 'tags', 'location', 'slug', 'video', 'collectiveSlug']);
  // run markdownToHtml on content in stories
  const stories = await Promise.all(
    allStories.map(async story => {
      return {
        ...story,
        tags: story.tags.map(tag => ({ color: categories.find(c => c.tag === tag)?.color ?? null, tag: tag })),
        content: await markdownToHtml(story.content),
        collective: collectives.find(c => c.slug === story.collectiveSlug) ?? null,
      };
    }),
  );

  const endTime = Date.now();
  const ms = endTime - startTime;

  const filter: Filter = {
    slug: host.slug,
    tag: 'ALL',
    timePeriod: 'ALL',
    location: null,
  };

  const data = compute({
    filter,
    allCollectives: collectives,
    categories,
  });
  return {
    props: {
      host,
      hosts,
      collectives: data.collectives,
      series: data.series,
      stats: data.stats,
      locationOptions: data.locationOptions,
      categories: data.categories,
      filter,
      stories: stories,
      startYear,
      currency,
      ms,
    },
    // revalidate: 60 * 60 * 24, // Revalidate the static page at most once every 24 hours to not overload the API
  };
};

export async function getStaticPaths() {
  return {
    paths: hosts
      .filter(h => h.slug !== '')
      .map(host => {
        return {
          params: {
            slug: host.slug,
          },
        };
      }),
    fallback: false,
  };
}

export default function Page({
  categories,
  stories,
  host,
  hosts,
  collectives,
  series,
  locationOptions,
  stats,
  currency,
  startYear,
  filter,
  ms,
}) {
  // eslint-disable-next-line no-console
  console.log(`Props built in ${ms} ms`);
  const locale = 'en';
  //return null;
  return (
    <Layout>
      <Head>
        <title>Discover {host.name}</title>
      </Head>
      <Dashboard
        filter={filter}
        categories={categories}
        collectives={collectives}
        series={series}
        stats={stats}
        locationOptions={locationOptions}
        currency={currency}
        startYear={startYear}
        stories={stories}
        locale={locale}
        host={host}
        hosts={hosts}
      />
    </Layout>
  );
}
