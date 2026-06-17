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
      variants(first: 10) {
        nodes {
          id
          title
          availableForSale
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
  query GetAllProducts($first: Int!) {
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
