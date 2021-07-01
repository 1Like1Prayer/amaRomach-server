import { gql } from 'apollo-server-koa';

export const typeDefs = gql`
  type Product {
    id: ID!
    name: String
    description: String
    imagePath: String
    price: Float
    amount: Int
    rating: Int
  }

  type CartProduct {
    id: ID!
    amount: Int
  }
  type Query {
    product(id: ID!): Product
    products: [Product]
    connectionQuery: Boolean
  }
  type Mutation {
    addProduct(product: ProductInput!): Product
    checkout(cartProducts: [CartProductInput]!): [Product]
    deleteProduct(id: ID!): Boolean
    editProduct(id: ID!, productChanges: ProductInput!): Product
    addProductToCart(id: ID!, amount: Int = 1): Product
    updateProductInCart(id: ID!, amount: Int): Product
    removeProductFromCart(id: ID!): Product
  }
  type Subscription {
    product: [CartProduct]
  }

  input ProductInput {
    name: String
    description: String
    imagePath: String
    price: Float
    amount: Int
    rating: Int
  }

  input CartProductInput {
    id: ID!
    amount: Int
  }
`;
