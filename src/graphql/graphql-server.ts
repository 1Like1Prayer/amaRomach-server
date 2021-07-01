import { ApolloError } from 'apollo-server';
import { ApolloServer } from 'apollo-server-koa';
import { GraphQLError } from 'graphql';
import { removeUserFromCart } from '../ws/cart-reservation/cart';
import { resolvers } from './resolvers/product-resolver';
import { typeDefs } from './schemas/product-schema';

export const graphqlServer = new ApolloServer({
  context: ({ ctx, connection }) => {
    return connection ? connection.context : { id: ctx.headers.id };
  },
  formatError: (error: GraphQLError) => {
    if (process.env.NODE_ENV === 'production') {
      return new ApolloError('Internal Error');
    }
    return new ApolloError(error.message);
  },
  playground: true,
  resolvers,
  subscriptions: {
    onConnect: (connectionParams) => connectionParams,
    onDisconnect: (_, context) => {
      context.initPromise.then(({ id }) => {
        removeUserFromCart(id);
      });
    },
  },
  typeDefs,
});
