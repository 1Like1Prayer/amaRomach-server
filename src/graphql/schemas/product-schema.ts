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

  type Query {
    product(id: ID!): Product
    products: [Product]
  }
  type Mutation {
    addProduct(product: ProductInput!): Product
    checkout(cartProducts: [CartProductInput]!): [Product]
    deleteProduct(id: ID!): Product
    editProduct(id: ID!, productChanges: ProductInput!): Product
  }
  type Subscription {
    products: [Product]
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
