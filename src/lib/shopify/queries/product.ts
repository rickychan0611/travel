export const PRODUCT_QUERY = `#graphql
  query GetProduct($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      description
      tags
      productType
      vendor
      images(first: 10) {
        nodes {
          url
          altText
        }
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      variants(first: 250) {
        nodes {
          id
          title
          availableForSale
          quantityAvailable
          price {
            amount
            currencyCode
          }
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
`

export const ALL_PRODUCTS_QUERY = `#graphql
  query GetAllProducts($first: Int!, $after: String, $query: String) {
    products(first: $first, after: $after, query: $query) {
      nodes {
        id
        handle
        title
        tags
        productType
        productCode: metafield(namespace: "toursbms", key: "product_code") { value }
        searchAliases: metafield(namespace: "toursbms", key: "search_aliases") { value }
        filterFacets: metafield(namespace: "toursbms", key: "filter_facets") { value }
        durationDays: metafield(namespace: "toursbms", key: "duration_days") { value }
        departureCity: metafield(namespace: "toursbms", key: "departure_city") { value }
        returnCity: metafield(namespace: "toursbms", key: "return_city") { value }
        country: metafield(namespace: "toursbms", key: "country") { value }
        destinations: metafield(namespace: "toursbms", key: "destinations") { value }
        filterLabels: metafield(namespace: "toursbms", key: "labels") { value }
        earliestDeparture: metafield(namespace: "toursbms", key: "earliest_departure") { value }
        latestDeparture: metafield(namespace: "toursbms", key: "latest_departure") { value }
        availabilitySummary: metafield(namespace: "toursbms", key: "availability_summary") { value }
        filterProductType: metafield(namespace: "toursbms", key: "product_type") { value }
        confirmMethod: metafield(namespace: "toursbms", key: "confirm_method") { value }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        images(first: 1) {
          nodes {
            url
            altText
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

export const COLLECTION_PRODUCTS_QUERY = `#graphql
  query GetCollection($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      id
      handle
      title
      products(first: $first) {
        nodes {
          id
          handle
          title
          tags
          productType
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 1) {
            nodes {
              url
              altText
            }
          }
        }
      }
    }
  }
`
