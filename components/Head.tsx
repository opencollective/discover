import React from 'react';
import NextHead from 'next/head';

export default function Head({ host, categories }) {
  const categoryLabels = categories.filter(c => c.tag && c.tag !== 'ALL').map(c => c.label.toLowerCase());

  return (
    <NextHead>
      <title>Discover {host.name}</title>
      <meta
        name="description"
        content={`Discover ${host.count.toLocaleString('en')} collectives ${host.root ? 'on' : 'hosted by'} ${
          host.name
        } making an impact in ${categoryLabels.join(', ')} and more.`}
      />
      <meta
        property="og:image"
        content={`https://discover.opencollective.com/api/og?${!host.root ? `hostSlug=${host.slug}&` : ``}count=${
          host.count
        }&tags=${categoryLabels.map(label => encodeURIComponent(label)).join(',')}`}
      />
    </NextHead>
  );
}
