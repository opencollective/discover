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
  -- Collectives that had credits with target hosts (to identify former members)
  collectives_with_target_host_history AS (
    SELECT DISTINCT COALESCE(c."ParentCollectiveId", c.id) AS parent_id
    FROM "Transactions" t
    INNER JOIN "Collectives" c ON c.id = t."CollectiveId"
    WHERE t."HostCollectiveId" IN (SELECT id FROM target_host_ids)
      AND t."type" = 'CREDIT'
      AND t."RefundTransactionId" IS NULL
      AND t."isRefund" IS NOT TRUE
      AND t."deletedAt" IS NULL
      AND c."deletedAt" IS NULL
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
      AND c.id IN (SELECT parent_id FROM collectives_with_target_host_history)
      AND (c."HostCollectiveId" IS NULL OR c."HostCollectiveId" NOT IN (SELECT id FROM target_host_ids))
      -- Comment out the next line to INCLUDE collectives that moved to another host
      AND c."HostCollectiveId" IS NULL
  ),
  -- All credits across ALL hosts, mapped to parent collective
  all_credits_by_parent AS (
    SELECT
      COALESCE(c."ParentCollectiveId", c.id) AS parent_id,
      t."hostCurrency",
      t."amountInHostCurrency"
    FROM "Transactions" t
    INNER JOIN "Collectives" c ON c.id = t."CollectiveId"
    WHERE COALESCE(c."ParentCollectiveId", c.id) IN (SELECT id FROM former_collectives)
      AND t."type" = 'CREDIT'
      AND t."RefundTransactionId" IS NULL
      AND t."isRefund" IS NOT TRUE
      AND t."deletedAt" IS NULL
      AND c."deletedAt" IS NULL
  ),
  -- Sum credits per parent across all hosts, pick currency with highest total
  money_raised AS (
    SELECT DISTINCT ON (parent_id)
      parent_id,
      "hostCurrency" AS currency,
      SUM("amountInHostCurrency") OVER (PARTITION BY parent_id, "hostCurrency") AS total
    FROM all_credits_by_parent
    ORDER BY parent_id, SUM("amountInHostCurrency") OVER (PARTITION BY parent_id, "hostCurrency") DESC
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
    fc.current_host_id,
    current_host.slug AS current_host_slug,
    mr.currency,
    ROUND((mr.total / 100.0)::numeric, 2) AS amount_raised,
    ROUND(((mr.total / 100.0) * COALESCE(fx.rate, 1))::numeric, 2) AS amount_raised_usd
  FROM former_collectives fc
  LEFT JOIN "Collectives" current_host ON current_host.id = fc.current_host_id
  LEFT JOIN money_raised mr ON mr.parent_id = fc.id
  LEFT JOIN latest_fx_rates fx ON fx."from" = mr.currency
  WHERE true
    -- Comment out the next line to INCLUDE collectives with less than 100 USD raised
    AND ((mr.total / 100.0) * COALESCE(fx.rate, 1)) >= 100
  ORDER BY amount_raised_usd DESC NULLS LAST;
