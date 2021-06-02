import { ApolloServer } from 'apollo-server-koa';
import { resolvers } from './resolvers/product-resolver';
import { typeDefs } from './schemas/product-schema';

export const graphqlServer = new ApolloServer({
  playground: true,
  resolvers,
  typeDefs,
});
