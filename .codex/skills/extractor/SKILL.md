---
name: extractor
description: Extract ToursBMS / uvbookings product pages by product code into Shopify-ready normalized JSON. Use when the user asks to scrape, export, convert, or prepare ToursBMS tour product details for Shopify, including highlights, pricing, departure dates, itinerary, costs, policies, notices, pickup/drop-off points, images, and add-on services.
---

# ToursBMS Product Extractor

## Quick Start

Use the repo script when it exists:

```bash
node scripts/product-extract.mjs P00002834
```

Useful options:

```bash
node scripts/product-extract.mjs P00002834 --lang 3 --currency USD --out data/toursbms-products/P00002834.json
node scripts/product-extract.mjs P00002834 --start 2026-07-13 --end 2027-12-31
```

The default output path is `data/toursbms-products/<PRODUCT_CODE>.json`.

## Workflow

1. Run the extractor with the requested ToursBMS product code.
2. Confirm the command reports a written JSON file and prints product title/base prices.
3. Inspect the JSON for these top-level sections:
   `product`, `media`, `highlights`, `departure`, `pricing`, `itinerary`, `cost`, `policy_notice`, `pickup_dropoff`, `constraints`, `addons`, `shopify_mapping`, and `source`.
4. Use `shopify_mapping` for initial Shopify import decisions, but keep the full normalized JSON as the source of truth because tour data is nested.

## API Notes

The extractor must discover branch context from the product page before calling APIs. Do not hardcode the branch unless debugging.

- Product page: `https://uvbookings.toursbms.com/en/product/detail?productCode=<PRODUCT_CODE>`
- Branch context comes from `window.__INITIAL_STATE__`, especially `branchInfo.branchCode` and `branchInfo.tokenCode`.
- Production API base: `https://online.ctrip.com/restapi/soa2`
- Main calls:
  - `17626/getProductBasic.json`
  - `17626/getProductTravelDetail.json`
  - `17626/getProductGroup.json`
  - `17626/getProductPromote.json`
  - `18554/getListWebSiteCurrency.json`
  - `17113/getlanguagepackage`

Most product API requests should include:

```json
{
  "requestUser": {
    "branchcode": "<branchCode>",
    "upBranchCode": "<branchCode>",
    "userCode": "U000000",
    "userName": "GUEST",
    "systemCode": 0,
    "tokenCode": "<tokenCode>"
  },
  "tokenCode": "<tokenCode>"
}
```

Also send headers `branchcode`, `languageCode`, `tokenCode`, `Content-Type: application/json`, and `X-Requested-With: XMLHttpRequest`.

Exception: call `17626/getProductTravelDetail.json` without `tokenCode` in the body or headers. With a token, ToursBMS may return itinerary skeleton rows where `contentType: 100` has `jsonContent: null`. Without the token, the same endpoint returns expanded route content. For itinerary descriptions, inspect:

```text
responseData.productTravel.productTravelInfoList[].dayList[].content[]
```

For a day route block, `contentType: 100` can contain `jsonContent` as a JSON string. Parse it, then inspect `expandList[].dayList[].content[].jsonContent`; those nested values are usually Base64 JSON. Decode them and use the nested `description` HTML/text for day-by-day itinerary details.

## Troubleshooting

- `User token cannot be empty`: the request is missing the page-discovered `tokenCode` in the body or headers, or the branch context was not parsed.
- `domain name does not exist`: use the domain key `uvbookings`, not the full host `uvbookings.toursbms.com`, if falling back to `GetWebSiteBranch`.
- `scheme information does not exist`: the product is not a package/scheme product; call `getProductGroup` with the product code and normal `productClassify` from `getProductBasic`.
- Empty rich itinerary blocks: make sure `getProductTravelDetail` is called without token, then parse JSON-string `jsonContent` and nested Base64 `jsonContent`. Preserve both decoded and raw content.

## Output Expectations

Preserve original HTML and cleaned text versions for Shopify body/metafields. Include extraction timestamp because pricing and availability are live data. Prefer normalized JSON first; generate Shopify CSV later from this JSON only when the user asks for a direct import file.
