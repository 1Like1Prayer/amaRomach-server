import { ApolloError, PubSub, UserInputError } from 'apollo-server';
import { Context } from 'koa';
import { Product, ProductModel } from '../../db/models/product';
import { ProductInCart } from '../../models/product-in-cart';
import {
  joiCheckOutSchema,
  joiIdSchema,
  joiProductAddSchema,
  joiProductEditSchema,
} from '../../validations/product-validation-schemas';
import {
  addItemToCart,
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
      const savedProduct = await new ProductModel(value).save();
      return savedProduct;
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
      updateItemInCart(context.id, productId, amount);
      pubsub.publish('PRODUCT_OCCUPY', { products: [{ id: productId, amount }] });
      return { id: productId, amount };
    },
    removeProductFromCart: (_: any, { id }: any, context: Context) => {
      const { value: productId, error } = joiIdSchema.validate(id);
      if (error) {
        throw new ApolloError(error.message);
      } else {
        const amountToRemove = removeItemFromCart(context.id, productId);
        pubsub.publish('PRODUCT_OCCUPY', { products: [{ id: productId, amount: amountToRemove }] });
        return { id: productId, amount: amountToRemove };
      }
    },
    checkout: async (_: any, { cartProducts }: any, context: Context) => {
      const { error, value } = joiCheckOutSchema.validate(cartProducts, { abortEarly: false });
      if (error) {
        throw new UserInputError(error.message);
      }
      const session = await ProductModel.startSession();
      const productsAfterCheckout: Product[] = [];
      try {
        await session.withTransaction(async () => {
          await Promise.all(
            value.map(async (cartProduct: ProductInCart) =>
              checkoutProduct(cartProduct, session, productsAfterCheckout),
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
