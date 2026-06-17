export const CART_CREATE_MUTATION = `#graphql
  mutation CartCreate($lines: [CartLineInput!]!, $note: String) {
    cartCreate(input: { lines: $lines, note: $note }) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`
