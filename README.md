# Discovery dashboard for Open Collective

The dashboard is meant to showcase what is going on in the ecosystem of Open Collective. You can find the deployed version on [discover.opencollective.com](https://discover.opencollective.com)

The project is boostrapped with the [Open Collective Frontend template](https://github.com/opencollective/opencollective-frontend-template)

## Overall structure

The app uses a combination of statically built data and data fetched on the client side.

The data for the table, graph and overall stats are fetched in the build process, using `/scripts/fetch-data.ts`, and added to the static bundle in `getStaticProps` ([read more about data fetching in NextJS](https://nextjs.org/docs/basic-features/data-fetching/get-static-props)).

In production, the app is rebuilt every 24 hours using a GitHub Action cron job that is calling a Vercel deploy hook, defined in `.github/workflows/daily-deploy.yml`

The Updates section is using a client side request to the API, as well as some Collective data that is not required for the table view (and being able to sort that), such as the Collective description and some extra stats available in the modal that opens when clicking on a Collective.

### Files/directories of note

- `lib/hosts.ts`
  This file has a definition what Fiscal Hosts to include, and their config.

- `_stories`
  This directory contains markdown files with Featured stories. The stories needs a `collectiveSlug`, and will be included in the page when there is a collective with that slug in the current filter.

- `_data`
  This directory stores the data from the `fetch-data` script.

## Getting Started

### 1. Fork the repository and install dependencies

Fork this repository, or clone it directly, and then install dependencies

```
git clone https://github.com/opencollective/horizons.git
cd horizons
npm install
```

### 2. Configure your local environment

By default, the app will try to connect to the Open Collective staging API & frontend.

To run the template against your local frontend/api, run:

`cp .env.local.example .env.local`

Learn more about the environment variables in NextJS: https://nextjs.org/docs/basic-features/environment-variables.

### 3. Fetch data

The dashboard needs a lot of data from the Open Collective API, and this data is fetched and saved to JSON files in `_data`, which the `getStaticProps` function in `pages/[slug].tsx` are importing.

Run this command to fetch data from the API (defined in the `NEXT_PUBLIC_OPENCOLLECTIVE_API_URL` environment variable).

```
npm run fetch-data
```

alternatively, `npm run build` will also run the fetch-data script before it builds the production bundle.

### 4. Start the application

To run your site locally (default: http://localhost:3004), use:

```
npm run dev
```

To run it in production mode, use:

```
npm run build
npm run start
```
