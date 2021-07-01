import { ApolloError, PubSub, UserInputError } from 'apollo-server';
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
  createUserCart,
  reduceCart,
  removeItemFromCart,
  updateItemInCart,
} from '../../ws/cart-reservation/cart';

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
    addProductToCart: (_: any, { id, amount }: any, context: any) => {
      const { value: productId, error } = joiIdSchema.validate(id);
      if (error) {
        throw new UserInputError(error.message);
      }
      addItemToCart(context.id, productId);
      pubsub.publish('PRODUCT_ADDED', { product: [{ id: productId, amount: 1 }] });
      return { id: productId, amount: 1 };
    },
    updateProductInCart: (_: any, { id, amount }: any, context: any) => {
      const { value: productId, error } = joiIdSchema.validate(id);
      if (error) {
        throw new UserInputError(error.message);
      }
      updateItemInCart(context.id, productId, amount);
      pubsub.publish('PRODUCT_CHANGED', { product: [{ id: productId, amount }] });
      return { id: productId, amount };
    },
    removeProductFromCart: (_: any, { id }: any, context: any) => {
      const { value: productId, error } = joiIdSchema.validate(id);
      if (error) {
        throw new UserInputError(error.message);
      }
      removeItemFromCart(context.id, productId);
      pubsub.publish('PRODUCT_CHANGED', { product: [{ id: productId, amount: 0 }] });
      return { id: productId, amount: 0 };
    },
    checkout: async (_: any, { cartProducts }: any, context: any) => {
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
        throw new UserInputError(error.message);
      }
      const product = await ProductModel.findByIdAndRemove(value);
      return product ? true : false;
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
      const product = await ProductModel.findByIdAndUpdate(productId, value, {
        new: true,
      });
      return product ? product : new UserInputError("Product Doesn't Exist");
    },
  },
  Query: {
    connectionQuery: (_: any, __: any, Context: any) => {
      createUserCart(Context.id);
      return true;
    },
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
    product: {
      subscribe: () => pubsub.asyncIterator(['PRODUCT_CHANGED', 'PRODUCT_ADDED']),
    },
  },
};

const checkoutProduct = async (
  cartProduct: ProductInCart,
  session: any,
  productsAfterCheckout: Product[],
) => {
  const product = await ProductModel.findOne({ _id: cartProduct.id }).session(session);
  if (!product) {
    throw new UserInputError("Product Doesn't Exist");
  }
  if (cartProduct.amount <= product.amount) {
    const updatedProduct = await ProductModel.findOneAndUpdate(
      { _id: cartProduct.id },
      { amount: product.amount - cartProduct.amount },
      { new: true, session },
    );
    productsAfterCheckout.push(updatedProduct);
  } else {
    throw new UserInputError('checkout amount exceeding the product current available amount');
  }
};
