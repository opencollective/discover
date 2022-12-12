import React from 'react';
import type { GetStaticProps } from 'next';
import Head from 'next/head';

import { hosts } from '../lib/hosts';
import { getAllPosts, markdownToHtml } from '../lib/markdown';

import Dashboard from '../components/Dashboard';
import Layout from '../components/Layout';

const colors = [
  { tw: 'red', color: '#EF4444' },
  { tw: 'orange', color: '#F97316' },
  { tw: 'amber', color: '#F59E0B' },
  { tw: 'yellow', color: '#EAB308' },
  { tw: 'lime', color: '#84CC16' },
  { tw: 'green', color: '#22C55E' },
  { tw: 'emerald', color: '#10B981' },
  { tw: 'teal', color: '#14B8A6' },
  { tw: 'cyan', color: '#06B6D4' },
  { tw: 'sky', color: '#0EA5E9' },
  { tw: 'blue', color: '#3B82F6' },
  { tw: 'indigo', color: '#6366F1' },
  { tw: 'violet', color: '#8B5CF6' },
  { tw: 'purple', color: '#A855F7' },
  { tw: 'fuchsia', color: '#D946EF' },
  { tw: 'pink', color: '#EC4899' },
  { tw: 'rose', color: '#F43F5E' },
];

const pickColorForCategory = (startColor: string, i: number, numOfCategories: number) => {
  const startColorIndex = colors.findIndex(c => c.tw === startColor);
  const step = Math.floor(colors.length / numOfCategories);
  return colors[(startColorIndex + i * step) % colors.length];
};

const getDataForHost = async ({ hostSlug }) => {
  const data = await require(`../_dump/${hostSlug}.json`);

  return {
    collectives: data.collectives,
  };
};

const associatedTags = {
  climate: ['climate change', 'climate justice'],
  'open source': ['opensource'],
};

// function that if I have the extra tag gives me the key
const getTagKey = tag => {
  const tagKey = Object.keys(associatedTags).find(key => associatedTags[key].includes(tag));
  return tagKey || tag;
};

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
  const { collectives } = await getDataForHost({ hostSlug: hostSlug ?? 'ALL' });

  let categories;
  if (!host?.categories) {
    // go through collectives and find the top tags
    const tags = collectives.reduce((acc, collective) => {
      collective.tags
        ?.filter(t => !['other', 'community', 'association', 'movement', 'USA'].includes(t))
        .forEach(tag => {
          const tagToUse = getTagKey(tag);
          if (!acc[tagToUse]) {
            acc[tagToUse] = 0;
          }
          acc[tagToUse]++;
        });
      return acc;
    }, {});

    const sortedTags = Object.keys(tags).sort((a, b) => tags[b] - tags[a]);
    const topTags = sortedTags.slice(0, 4);
    categories = topTags.map(tag => {
      // capitalize first letter in all words
      const label = tag
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      return { label, tag, extraTags: associatedTags[tag] ?? null };
    });
  } else {
    categories = host.categories;
  }
  // add color to categories
  categories = [{ label: 'All Categories', tag: 'ALL' }, ...categories].map((category, i, arr) => {
    const { color, tw } = pickColorForCategory(host?.color ?? 'blue', i, arr.length);

    return {
      ...category,
      color,
      tw,
    };
  });

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

  return {
    props: {
      host,
      hosts,
      collectives,
      categories,
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

export default function Page({ categories, stories, host, hosts, collectives, currency, startYear, ms }) {
  // eslint-disable-next-line no-console
  console.log(`Props built in ${ms} ms`);
  const locale = 'en';
  return (
    <Layout>
      <Head>
        <title>Discover {host.name}</title>
      </Head>
      <Dashboard
        categories={categories}
        collectives={collectives}
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
