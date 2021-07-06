import { ApolloError, PubSub, UserInputError } from 'apollo-server';
import { Context } from 'koa';
import { Product, ProductModel } from '../../db/models/product';
import {
  joiIdSchema,
  joiProductAddSchema,
  joiProductEditSchema,
} from '../../validations/product-validation-schemas';
import {
  addItemToCart,
  cart,
  checkoutUser,
  reduceCart,
  removeItemFromCart,
  updateItemInCart,
} from '../../ws/cart-reservation/cart';
import { checkoutProduct } from '../utils/checkout.util';

export const pubsub = new PubSub();

export const resolvers = {
  Mutation: {
    addProduct: async (_: any, { product }: any) => {
      const { error, value } = joiProductAddSchema.validate(product);
      if (error) {
        throw new UserInputError(error.message);
      }

      return new ProductModel(value).save();
    },
    addProductToCart: (_: any, { id, amount }: any, context: Context) => {
      const { value: productId, error } = joiIdSchema.validate(id);
      if (error) {
        throw new ApolloError(error.message);
      }

      addItemToCart(context.id, productId);
      pubsub.publish('PRODUCT_OCCUPY', { products: [{ id: productId, amount: 1 }] });
      return { id: productId, amount: 1 };
    },
    updateProductInCart: (_: any, { id, amount }: any, context: Context) => {
      const { value: productId, error } = joiIdSchema.validate(id);
      if (error) {
        throw new ApolloError(error.message);
      }

      const deltaAmount = updateItemInCart(context.id, productId, amount);
      pubsub.publish('PRODUCT_OCCUPY', { products: [{ id: productId, amount: deltaAmount }] });
      return { id: productId, amount: deltaAmount };
    },
    removeProductFromCart: (_: any, { id }: any, context: Context) => {
      const { value: productId, error } = joiIdSchema.validate(id);
      if (error) {
        throw new ApolloError(error.message);
      }

      const amountToRemove = removeItemFromCart(context.id, productId);
      pubsub.publish('PRODUCT_OCCUPY', { products: [{ id: productId, amount: amountToRemove }] });
      return { id: productId, amount: amountToRemove };
    },
    checkout: async (_: any, __: any, context: Context) => {
      const cartProductsIds = Object.keys(cart[context.id]);
      const session = await ProductModel.startSession();
      const productsAfterCheckout: Product[] = [];
      try {
        await session.withTransaction(async () => {
          await Promise.all(
            cartProductsIds.map(async (productId: string) =>
              checkoutProduct(
                { id: productId, amount: cart[context.id][productId] },
                session,
                productsAfterCheckout,
              ),
            ),
          );
        });
        session.endSession();
      } catch (err) {
        session.endSession();
        throw new ApolloError(err.message);
      }
      checkoutUser(context.id);
      return productsAfterCheckout;
    },
    deleteProduct: async (_: any, { id }: any) => {
      const { error, value } = joiIdSchema.validate(id);
      if (error) {
        throw new ApolloError(error.message);
      }

      const product = await ProductModel.findByIdAndRemove(value);
      return product ? true : new ApolloError('Product does not exist');
    },
    editProduct: async (_: any, { id, productChanges }: any) => {
      const { error: err, value: productId } = joiIdSchema.validate(id);
      if (err) {
        throw new ApolloError(err.message);
      }

      const { error, value } = joiProductEditSchema.validate(productChanges, {
        abortEarly: false,
      });

      if (error) {
        throw new UserInputError(error.message);
      }

      const product = await ProductModel.findByIdAndUpdate(productId, value, {
        new: true,
      });
      return product ? product : new ApolloError("Product Doesn't Exist");
    },
  },
  Query: {
    product: async (_: any, { id }: any) => {
      const { error, value } = joiIdSchema.validate(id);
      if (error) {
        throw new UserInputError(error.message);
      }

      const product = await ProductModel.findById(value);
      return product ? product : new UserInputError("Product Doesn't Exist)");
    },
    products: async () => {
      const products = await ProductModel.find();
      return reduceCart(products);
    },
  },
  Subscription: {
    products: {
      subscribe: () => pubsub.asyncIterator(['PRODUCT_OCCUPY']),
    },
  },
};
