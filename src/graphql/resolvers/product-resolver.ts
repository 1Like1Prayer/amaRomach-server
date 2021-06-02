import { ApolloError, PubSub, UserInputError } from 'apollo-server';
import { Product, ProductModel } from '../../db/models/product';
import { ProductInCart } from '../../models/product-in-cart';
import {
  joiCheckOutSchema,
  joiIdSchema,
  joiProductAddSchema,
  joiProductEditSchema,
} from '../../validations/product-validation-schemas';

const pubsub = new PubSub();

export const resolvers = {
  Mutation: {
    addProduct: async (_: any, { product }: any) => {
      const { error, value } = joiProductAddSchema.validate(product);
      if (error) {
        throw new UserInputError(error.message);
      }
      try {
        const savedProduct = await new ProductModel(value).save();
        const products = await ProductModel.find();
        pubsub.publish('PRODUCTS_CHANGED', { products });
        return savedProduct;
      } catch (err) {
        throw new ApolloError(err.message);
      }
    },
    checkout: async (_: any, { cartProducts }: any) => {
      let products: Product[];
      const { error, value } = joiCheckOutSchema.validate(cartProducts, { abortEarly: false });
      if (error) {
        throw new UserInputError(error.message);
      }
      const session = await ProductModel.startSession();
      const productsAfterCheckout: Product[] = [];
      try {
        await session.withTransaction(async () => {//תמיר
          await Promise.all(
            value.map(async (cartProduct: ProductInCart) => {
              const product = await ProductModel.findOne({ _id: cartProduct.id }).session(session);
              if (product && cartProduct.amount <= product.amount) {
                const updatedProduct = await ProductModel.findOneAndUpdate(
                  { _id: cartProduct.id },
                  { amount: product.amount - cartProduct.amount },
                  { new: true, session },
                );
                productsAfterCheckout.push(updatedProduct);
              } else {
                throw new UserInputError(
                  'checkout amount exceeding the product current available amount',
                );
              }
            }),
          );
        });
        session.endSession();
        products = await ProductModel.find();
      } catch (err) {
        session.endSession();
        throw new ApolloError(err.message);
      }
      pubsub.publish('PRODUCTS_CHANGED', { products });
      return productsAfterCheckout;
    },
    deleteProduct: async (_: any, { id }: any) => {
      const { error, value } = joiIdSchema.validate(id);
      if (error) {
        throw new UserInputError(error.message);
      }
      try {
        const product = await ProductModel.findByIdAndRemove(value);
        const products = await ProductModel.find();
        pubsub.publish('PRODUCTS_CHANGED', { products });
        return product;
      } catch (err) {
        throw new ApolloError(err.message);
      }
    },
    editProduct: async (_: any, { id, productChanges }: any) => {
      const { error: err, value: productId } = joiIdSchema.validate(id);
      if (err) {
        throw new UserInputError(err.message);
      }
      const { error, value } = joiProductEditSchema.validate(productChanges, {
        abortEarly: false,
      });
      if (error) {
        throw new UserInputError(error.message);
      }
      try {
        const product = await ProductModel.findByIdAndUpdate(productId, value, {
          new: true,
        });
        const products = await ProductModel.find();
        pubsub.publish('PRODUCTS_CHANGED', { products });
        return product;
      } catch (err) {
        throw new ApolloError(err.message);
      }
    },
  },
  Query: {
    product: async (_: any, { id }: any) => {
      const { error, value } = joiIdSchema.validate(id);
      if (error) {
        throw new UserInputError(error.message);
      }
      try {
        return await ProductModel.findById(value);
      } catch (err) {
        return new ApolloError(err.message);
      }
    },
    products: async () => {
      try {
        return await ProductModel.find();
      } catch (err) {
        throw new ApolloError(err.message);
      }
    },
  },
  Subscription: {
    products: {
      subscribe: () => pubsub.asyncIterator(['PRODUCTS_CHANGED']),
    },
  },
};
