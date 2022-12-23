import React from 'react';
import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

import { hosts } from '../../lib/hosts';

import { pickColorForCategory } from '../../utils/colors';

// Make sure the font exists in the specified path:
const font = fetch(new URL('../../public/fonts/inter/Inter-Bold.woff', import.meta.url)).then(res => res.arrayBuffer());

export const config = {
  runtime: 'experimental-edge',
};

export default async function OG(req: NextRequest) {
  const fontData = await font;
  const { searchParams } = new URL(req.url);
  const hasHost = searchParams.has('hostSlug');
  const hostSlug = hasHost ? searchParams.get('hostSlug') : '';
  const host = hosts.find(h => h.slug === hostSlug || (!hostSlug && h.root)) || hosts[0];

  const hasTags = searchParams.has('tags');
  const tagsParams = hasTags ? searchParams.get('tags') : '';
  const hasCount = searchParams.has('count');
  const count = hasCount ? searchParams.get('count') : '';
  const tags = tagsParams?.split(',').map(tag => tag.replace('and', '&').trim()) || [];
  const spanStyle = {
    display: 'flex',
    flexShrink: 0,
    marginRight: 12,
    fontWeight: 'bolder',
    letterSpacing: '-0.025em',
  };
  const tagStyles = tags.map((tag, i) => {
    // to get same colors, we need to add 1 to the index and add 2 to the total length since we start without the "All" tag and without the More.. category
    const color = pickColorForCategory(host.color.closestPaletteColor, i + 1, tags.length + 2);
    return {
      ...spanStyle,
      textDecoration: 'underline',
      textDecorationColor: color.hex,
      textDecorationSkip: 'ink',
      marginRight: 0,
    };
  });
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: '64px',
          background: 'rgb(249 250 251)',
          padding: '60px',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          fontFamily: '"Inter"',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          <span style={spanStyle}>Discover</span> <span style={spanStyle}>{count?.toLocaleString()}</span>{' '}
          <span style={spanStyle}>collectives</span> <span style={spanStyle}>{host.root ? 'on' : 'hosted by'}</span>{' '}
          {host.name.split(' ').map(word => {
            return (
              <span
                key={word}
                style={{
                  ...spanStyle,
                  color: host.color.brand,
                  textDecoration: 'underline',
                  textDecorationColor: host.color.brand,
                  textDecorationSkip: 'ink',
                }}
              >
                <span>{word}</span>
              </span>
            );
          })}
          <span style={spanStyle}>making</span> <span style={spanStyle}>an</span> <span style={spanStyle}>impact</span>{' '}
          <span style={spanStyle}>in</span>
          {tags.map((tag, i, arr) => {
            return (
              <span style={{ marginRight: 12 }} key={tag}>
                <span style={tagStyles[i]}>{tag}</span>
                {arr.length - 1 === i ? ' ' : ', '}
              </span>
            );
          })}
          <span style={spanStyle}>and more.</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 600,
      fonts: [
        {
          name: 'Inter',
          data: fontData,
          style: 'normal',
        },
      ],
    },
  );
}
