// Group tags will not transform the tag itself, but just include more tags when filtering on the key tag
// Group tags should include the tag itself
const defaultGroupTags = {
  climate: ['climate', 'climate change', 'climate justice', 'climate crisis', 'climate action', 'climate emergency'],
  'arts and culture': ['arts and culture', 'art', 'arts', 'visual art', 'visual arts', 'music'],
};

// Tags to exclude from the automatic category creation. These will still show up under "More..."
const defaultExcludeCategoryTags = [
  'other',
  'online',
  'community',
  'association',
  'movement',
  'usa',
  'midwestern usa',
  'illinois',
  'europe',
  'chicago',
  'opencollectiveeu',
];

export const hosts: {
  root?: boolean;
  name: string;
  slug?: string;
  hostSlugs?: string[];
  currency: string;
  startYear: number;
  logoSrc: string;
  color: { hex: string; closestPaletteColor: string };
  styles: {
    text: string;
    groupHoverText: string;
    button: string;
    brandBox: string;
    box: string;
    border: string;
  };
  website?: string;
  cta?: { text: string; textLonger: string; href: string; buttonLabel: string };
  groupTags: { [key: string]: string[] };
  includeCategoryTags: string[];
  excludeCategoryTags: string[];
}[] = [
  {
    root: true,
    name: 'Open Collective',
    hostSlugs: [
      // 'foundation',
      'europe',
      'oce-foundation-usd',
      'oce-foundation-eur',
      'opensource',
      'open-source-collective-eur1',
      'the-social-change-nest',
      'the-social-change-nest-eu',
      'giftcollective',
      'raft',
      // 'allforclimate',
      // 'ocnz',
      // 'numfocus',
      // 'platform6-coop',
      // 'wwcodeinc',
      // 'reculture',
      // 'fission',
      // 'ferrous-systems-gmbh',
      // 'nfsc',
      // 'xwikisas',
      // 'metagov',
      // 'foreningen-granslandet',
      // 'huddlecraft',
      // 'psl-foundation',
      // 'pact_collective',
      // 'brussels',
      // 'vcs-academy',
      // 'nativesintech',
      // 'thirty-percy'
    ],
    currency: 'USD',
    startYear: 2016,
    logoSrc: '/oc-logo.svg',
    color: { hex: '#0C2D66', closestPaletteColor: 'blue' },
    website: 'https://opencollective.com',
    styles: {
      text: 'text-[#0C2D66]',
      groupHoverText: 'group-hover:text-[#0C2D66]',
      button: 'bg-[#0C2D66] text-white',
      brandBox: 'lg:bg-[#F5FAFF] text-[#0C2D66]',
      box: 'bg-[#F5FAFF] text-[#0C2D66]',
      border: 'border-[#0C2D66]',
    },
    groupTags: {
      ...defaultGroupTags,
      'mutual aid': ['mutual aid', 'covid'],
      education: ['education', 'meetup'],
    },
    includeCategoryTags: [],
    excludeCategoryTags: [...defaultExcludeCategoryTags],
  },
  {
    name: 'Open Source Collective',
    slug: 'opensource',
    hostSlugs: ['opensource', 'open-source-collective-eur1'],
    currency: 'USD',
    startYear: 2016,
    logoSrc: '/osc-logo.svg',
    website: 'https://opencollective.com/opensource',
    color: { hex: '#4B3084', closestPaletteColor: 'purple' },
    styles: {
      text: 'text-[#4B3084]',
      groupHoverText: 'group-hover:text-[#4B3084]',
      button: 'bg-[#4B3084] text-white',
      brandBox: 'lg:bg-[#4B3084] lg:bg-opacity-5 text-[#4B3084]',
      box: 'bg-[#4B3084] bg-opacity-5 text-[#4B3084]',
      border: 'border-[#4B3084]',
    },
    groupTags: {
      ...defaultGroupTags,
    },
    includeCategoryTags: [],
    excludeCategoryTags: [...defaultExcludeCategoryTags, 'open source', 'hacktoberfest'],
  },
  {
    name: 'Open Collective Europe',
    slug: 'europe',
    hostSlugs: ['europe', 'oce-foundation-usd', 'oce-foundation-eur'],
    currency: 'EUR',
    startYear: 2019,
    logoSrc: '/oce-logo.svg',
    website: 'https://opencollective.com/europe',
    color: { hex: '#0C2D66', closestPaletteColor: 'blue' },
    styles: {
      text: 'text-[#0C2D66]',
      groupHoverText: 'group-hover:text-[#0C2D66]',
      button: 'bg-[#0C2D66] text-white',
      brandBox: 'lg:bg-[#E0EC7B] lg:bg-opacity-20 text-[#0C2D66]',
      box: 'bg-[#E0EC7B] bg-opacity-20 text-[#0C2D66]',
      border: 'border-[#0C2D66]',
    },
    groupTags: {
      ...defaultGroupTags,
    },
    includeCategoryTags: [],
    excludeCategoryTags: [...defaultExcludeCategoryTags],
  },
  {
    name: 'Gift Collective',
    slug: 'giftcollective',
    currency: 'NZD',
    startYear: 2020,
    logoSrc: '/gift-collective-logo.png',
    website: 'https://opencollective.com/giftcollective',
    color: { hex: '#6B9E9E', closestPaletteColor: 'teal' },
    styles: {
      text: 'text-[#6B9E9E]',
      groupHoverText: 'group-hover:text-[#6B9E9E]',
      button: 'bg-[#6B9E9E] text-white',
      brandBox: 'lg:bg-[#6B9E9E] lg:bg-opacity-5 text-[#6B9E9E]',
      box: 'bg-[#6B9E9E] bg-opacity-5 text-[#6B9E9E]',
      border: 'border-[#6B9E9E]',
    },
    groupTags: {
      ...defaultGroupTags,
    },
    includeCategoryTags: [],
    excludeCategoryTags: [...defaultExcludeCategoryTags],
  },
  {
    name: 'Social Change Nest',
    slug: 'the-social-change-nest',
    hostSlugs: ['the-social-change-nest', 'the-social-change-nest-eu'],
    currency: 'GBP',
    startYear: 2019,
    logoSrc: '/social-change-nest-logo.png',
    website: 'https://opencollective.com/the-social-change-nest',
    color: { hex: '#EC008C', closestPaletteColor: 'pink' },
    styles: {
      text: 'text-[#EC008C]',
      groupHoverText: 'group-hover:text-[#EC008C]',
      button: 'bg-[#EC008C] text-white',
      brandBox: 'lg:bg-[#EC008C] lg:bg-opacity-5 text-[#EC008C]',
      box: 'bg-[#EC008C] bg-opacity-5 text-[#EC008C]',
      border: 'border-[#EC008C]',
    },
    groupTags: {
      ...defaultGroupTags,
    },
    includeCategoryTags: [],
    excludeCategoryTags: [...defaultExcludeCategoryTags],
  },
  {
    name: 'Raft Foundation',
    slug: 'raft',
    currency: 'USD',
    startYear: 2021,
    logoSrc: '/raft-logo.png',
    website: 'https://opencollective.com/raft',
    color: { hex: '#C4B454', closestPaletteColor: 'yellow' },
    styles: {
      text: 'text-[#C4B454]',
      groupHoverText: 'group-hover:text-[#C4B454]',
      button: 'bg-[#C4B454] text-white',
      brandBox: 'lg:bg-[#C4B454] lg:bg-opacity-5 text-[#C4B454]',
      box: 'bg-[#C4B454] bg-opacity-5 text-[#C4B454]',
      border: 'border-[#C4B454]',
    },
    groupTags: {
      ...defaultGroupTags,
    },
    includeCategoryTags: [],
    excludeCategoryTags: [...defaultExcludeCategoryTags],
  },
];
