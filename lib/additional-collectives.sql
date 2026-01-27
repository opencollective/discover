-- Find collectives that left the specified hosts with money raised estimate
  -- (projects and events amounts merged into their parent)
  WITH target_host_ids AS (
    SELECT unnest(ARRAY[
      9807,    -- foundation
      11049,   -- europe
      169078,  -- oce-foundation-usd
      729588,  -- oce-foundation-eur
      696998,  -- opensource
      11004,   -- open-source-collective-eur1
      1012924, -- the-social-change-nest
      766450,  -- the-social-change-nest-eu
      98478,   -- giftcollective
      820725   -- raft
    ]) AS id
  ),
  -- All credits with target hosts, mapped to parent collective
  credits_by_parent AS (
    SELECT
      COALESCE(c."ParentCollectiveId", c.id) AS parent_id,
      t."HostCollectiveId",
      t."hostCurrency",
      t."amountInHostCurrency"
    FROM "Transactions" t
    INNER JOIN "Collectives" c ON c.id = t."CollectiveId"
    WHERE t."HostCollectiveId" IN (SELECT id FROM target_host_ids)
      AND t."type" = 'CREDIT'
      AND t."RefundTransactionId" IS NULL
      AND t."deletedAt" IS NULL
      AND c."deletedAt" IS NULL
  ),
  -- Parent IDs that had credits (directly or via projects/events)
  parent_ids_with_credits AS (
    SELECT DISTINCT parent_id FROM credits_by_parent
  ),
  -- Parent collectives that are no longer hosted by target hosts
  former_collectives AS (
    SELECT
      c.id,
      c.slug,
      c.name,
      c.type,
      c."HostCollectiveId" AS current_host_id
    FROM "Collectives" c
    WHERE c."deletedAt" IS NULL
      AND c.type NOT IN ('PROJECT', 'EVENT')
      AND c.id IN (SELECT parent_id FROM parent_ids_with_credits)
      AND (c."HostCollectiveId" IS NULL OR c."HostCollectiveId" NOT IN (SELECT id FROM target_host_ids))
      -- Comment out the next line to INCLUDE collectives that moved to another host
      AND c."HostCollectiveId" IS NULL
  ),
  -- Sum credits per parent, pick the host with highest total
  money_raised AS (
    SELECT DISTINCT ON (parent_id)
      parent_id,
      "HostCollectiveId" AS former_host_id,
      "hostCurrency" AS currency,
      SUM("amountInHostCurrency") OVER (PARTITION BY parent_id, "HostCollectiveId") AS total
    FROM credits_by_parent
    WHERE parent_id IN (SELECT id FROM former_collectives)
    ORDER BY parent_id, SUM("amountInHostCurrency") OVER (PARTITION BY parent_id, "HostCollectiveId") DESC
  ),
  latest_fx_rates AS (
    SELECT DISTINCT ON ("from")
      "from",
      rate
    FROM "CurrencyExchangeRates"
    WHERE "to" = 'USD'
    ORDER BY "from", "createdAt" DESC
  )
  SELECT
    fc.id,
    fc.slug,
    fc.name,
    fc.type,
    former_host.slug AS former_host_slug,
    fc.current_host_id,
    current_host.slug AS current_host_slug,
    mr.currency,
    ROUND((mr.total / 100.0)::numeric, 2) AS amount_raised,
    ROUND(((mr.total / 100.0) * COALESCE(fx.rate, 1))::numeric, 2) AS amount_raised_usd
  FROM former_collectives fc
  LEFT JOIN "Collectives" current_host ON current_host.id = fc.current_host_id
  LEFT JOIN money_raised mr ON mr.parent_id = fc.id
  LEFT JOIN "Collectives" former_host ON former_host.id = mr.former_host_id
  LEFT JOIN latest_fx_rates fx ON fx."from" = mr.currency
  WHERE true
    -- Comment out the next line to INCLUDE collectives with less than 100 USD raised
    AND ((mr.total / 100.0) * COALESCE(fx.rate, 1)) >= 100
  ORDER BY former_host.slug, amount_raised_usd DESC NULLS LAST;
