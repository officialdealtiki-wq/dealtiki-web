/**
 * DealTiki Data Correctness Verification Test Suite
 * Tests deterministic IDs, Cuelinks deduplication, multi-offer campaign separation,
 * and cache isolation.
 */
process.env.DEALTIKI_TEST_RUN = "true";

import { buildStableDealId } from "./src/lib/deterministic-id";
import { buildServerStableDealId, buildDealsCacheKey, createSlug } from "./server";
import { normalizeDeal, deduplicateDeals } from "./src/lib/normalize-deal";

function runTests() {
  console.log("=== RUNNING DEALTIKI DATA CORRECTNESS TESTS ===");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TEST 1: Multiple Offers from Same Cuelinks Campaign (Campaign 201)
  // -------------------------------------------------------------
  const offerA = {
    campaign_id: 201,
    campaign_name: "Croma Retail",
    merchant: "Croma",
    title: "Oppo Reno 15 Pro Mini 5G (8GB/256GB)",
    affiliate_url: "https://linksredirect.com/?cid=123&source=linkkit&url=https%3A%2F%2Fwww.croma.com%2Foppo-reno&subid=deal1",
    deal_price: 32999,
    mrp: 39999,
  };

  const offerB = {
    campaign_id: 201,
    campaign_name: "Croma Retail",
    merchant: "Croma",
    title: "Samsung Galaxy S24 Ultra 5G",
    affiliate_url: "https://linksredirect.com/?cid=123&source=linkkit&url=https%3A%2F%2Fwww.croma.com%2Fsamsung-s24&subid=deal2",
    deal_price: 119999,
    mrp: 134999,
  };

  const offerC = {
    campaign_id: 201,
    campaign_name: "Croma Retail",
    merchant: "Croma",
    title: "MacBook Air M3 15-inch 16GB RAM",
    affiliate_url: "https://linksredirect.com/?cid=123&source=linkkit&url=https%3A%2F%2Fwww.croma.com%2Fmacbook-air-m3&subid=deal3",
    deal_price: 124900,
    mrp: 134900,
  };

  const idA1 = buildStableDealId(offerA);
  const idA2 = buildStableDealId(offerA);
  const idB = buildStableDealId(offerB);
  const idC = buildStableDealId(offerC);

  const serverIdA1 = buildServerStableDealId(offerA);
  const serverIdA2 = buildServerStableDealId(offerA);
  const serverIdB = buildServerStableDealId(offerB);
  const serverIdC = buildServerStableDealId(offerC);

  assert(idA1 === idA2, "Offer A processed twice produces identical client stable ID");
  assert(serverIdA1 === serverIdA2, "Offer A processed twice produces identical server stable ID");
  assert(idA1 === serverIdA1, "Client and Server produce identical stable ID for Offer A");

  assert(idA1 !== idB, "Offer A and Offer B (same campaign 201) have DIFFERENT client IDs");
  assert(serverIdA1 !== serverIdB, "Offer A and Offer B (same campaign 201) have DIFFERENT server IDs");
  assert(idB !== idC, "Offer B and Offer C have DIFFERENT IDs");
  assert(idA1 !== idC, "Offer A and Offer C have DIFFERENT IDs");

  // -------------------------------------------------------------
  // TEST 2: Cuelinks Multi-Offer Deduplication Retains ALL 3 Deals
  // -------------------------------------------------------------
  const normalizedA = normalizeDeal(offerA);
  const normalizedB = normalizeDeal(offerB);
  const normalizedC = normalizeDeal(offerC);

  assert(normalizedA !== null && normalizedB !== null && normalizedC !== null, "All 3 offers normalized successfully");

  const dedupedList = deduplicateDeals([normalizedA!, normalizedB!, normalizedC!, normalizeDeal(offerA)!]);
  assert(dedupedList.length === 3, `Expected exactly 3 deals after deduplicating 4 items (including duplicate A), got ${dedupedList.length}`);

  // -------------------------------------------------------------
  // TEST 3: Affiliate Tracking URLs are strictly preserved intact
  // -------------------------------------------------------------
  assert(
    normalizedA?.affiliateLink === offerA.affiliate_url,
    "Offer A affiliateLink is preserved with all query params (cid, source, url, subid)"
  );
  assert(
    normalizedB?.affiliateLink === offerB.affiliate_url,
    "Offer B affiliateLink is preserved with all query params intact"
  );

  // -------------------------------------------------------------
  // TEST 4: Persistent Slug Generation
  // -------------------------------------------------------------
  const slugA = createSlug(offerA.title, idA1);
  assert(slugA.startsWith("oppo-reno-15-pro-mini-5g"), `Slug generated correctly: ${slugA}`);
  assert(slugA === createSlug(offerA.title, idA1), "Slug generation is deterministic");

  // -------------------------------------------------------------
  // TEST 5: Filter Cache Isolation
  // -------------------------------------------------------------
  const cacheKey1 = buildDealsCacheKey({
    keyword: "phone",
    minPrice: 100,
    maxPrice: 1000,
    sort: "latest",
  });
  const cacheKey2 = buildDealsCacheKey({
    keyword: "phone",
    minPrice: 50000,
    maxPrice: 100000,
    sort: "latest",
  });
  const cacheKey3 = buildDealsCacheKey({
    keyword: "phone",
    minPrice: 100,
    maxPrice: 1000,
    freshMinutes: 60,
    sort: "discount",
  });

  assert(cacheKey1 !== cacheKey2, "Different price range queries have isolated cache keys");
  assert(cacheKey1 !== cacheKey3, "Different sort/freshMinutes queries have isolated cache keys");

  // -------------------------------------------------------------
  // TEST 6: Explicit Offer ID vs Campaign ID Priority
  // -------------------------------------------------------------
  const offerWithRealOfferId = {
    campaign_id: 201,
    offer_id: 8842,
    title: "Explicit Offer Item",
    affiliate_url: "https://linksredirect.com/?offer_id=8842&url=https%3A%2F%2Fcroma.com",
  };
  const offerIdBuilt = buildStableDealId(offerWithRealOfferId);
  assert(offerIdBuilt === "cue-off-8842", `Authentic offer_id yields 'cue-off-8842': got ${offerIdBuilt}`);

  console.log(`\n=== SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
