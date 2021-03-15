import * as Joi from '@hapi/joi';
import { Socket } from 'socket.io';
import { errorMessages } from '../../controllers/products-controller';
import { Product, ProductModel } from '../../db/models/product';
import { parseJoiError } from '../../middlewares/error-middleware';
import { JoiError } from '../../models/joi-error';
import { ProductInCart } from '../../models/product-in-cart';
import { ServerError } from '../../models/server-error';
import { logger } from '../../utils/logs/logger';
import {
  joiCheckOutSchema,
  joiIdSchema,
  joiProductInCartSchema,
} from '../../validations/product-validation-schemas';
import {
  addItemToCart,
  checkoutUser,
  createUserCart,
  reduceCart,
  removeItemFromCart,
  removeUserFromCart,
  updateItemInCart,
} from '../cart-reservation/cart';
import { SocketActions } from '../models/socket-actions';

export const socketMiddleware = (socket: Socket, next: any) => {
  socket.on(SocketActions.CONNECTED, async (callback) => {
    const { error, value } = Joi.string().validate(socket.id);
    if (error) {
      socket.emit(
        'error',
        new ServerError(error.message, 400, errorMessages.NOT_VALID, error.details),
      );
    } else {
      logger.info(`inside socket connected -${value}`);
      createUserCart(value);
      try {
        const products = await ProductModel.find();
        callback(reduceCart(products));
      } catch (err) {
        socket.emit('error', new ServerError(err.message, 500, errorMessages.INTERNAL));
      }
    }
  });
  socket.on(SocketActions.ADD_TO_CART, (productId) => {
    const { error, value } = joiIdSchema.validate(productId);
    if (error) {
      socket.emit(
        'error',
        new ServerError(error.message, 400, errorMessages.NOT_VALID, error.details),
      );
    } else {
      addItemToCart(socket.id, { id: value, amount: 0 });
    }
  });

  socket.on(SocketActions.REMOVE_FROM_CART, (productId: string) => {
    const { error, value } = joiIdSchema.validate(productId);
    if (error) {
      socket.emit(
        'error',
        new ServerError(error.message, 400, errorMessages.NOT_VALID, error.details),
      );
    } else {
      const amount = removeItemFromCart(socket.id, value);
      socket.broadcast.emit(SocketActions.UPDATE_PRODUCT_IN_CLIENT, value, amount);
    }
  });

  socket.on(SocketActions.UPDATE_PRODUCT_IN_CART, (productId: string, amount: number) => {
    const { error, value } = joiProductInCartSchema.validate({ amount, id: productId });
    if (error) {
      socket.emit(
        'error',
        new ServerError(error.message, 400, errorMessages.NOT_VALID, error.details),
      );
    } else {
      const broadcastAmount = updateItemInCart(socket.id, value.id, value.amount);
      socket.broadcast.emit(SocketActions.UPDATE_PRODUCT_IN_CLIENT, value.id, broadcastAmount);
    }
  });

  socket.on(SocketActions.CHECKOUT, async (products: ProductInCart[]) => {
    const { error, value } = joiCheckOutSchema.validate(products, { abortEarly: false });
    if (error) {
      socket.emit(
        'error',
        new ServerError(error.message, 400, errorMessages.NOT_VALID, error.details),
      );
    }
    const session = await ProductModel.startSession();
    const productsAfterCheckout: Product[] = [];
    try {
      session.startTransaction();
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
            socket.emit(
              'error',
              new Error('checkout amount exceeding the product current available amount'),
            );
          }
        }),
      );
      await session.commitTransaction();
      session.endSession();
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      socket.emit('error', new ServerError(error.message, 500, errorMessages.INTERNAL));
    }
    checkoutUser(socket.id);
  });

  socket.on(SocketActions.DISCONNECT, () => {
    const { error, value } = Joi.string().validate(socket.id);
    if (error) {
      socket.emit(
        'error',
        new ServerError(error.message, 400, errorMessages.NOT_VALID, error.details),
      );
    } else {
      logger.info(`socket disconnected - ${value}`);
      const productsToRemove = removeUserFromCart(value);
      Object.keys(productsToRemove).forEach((productId: string) => {
        socket.broadcast.emit(
          SocketActions.UPDATE_PRODUCT_IN_CLIENT,
          productId,
          productsToRemove[productId],
        );
      });
    }
  });
  socket.on(SocketActions.ERROR, (err: ServerError) => {
    if (err.joiError) {
      const joiError: JoiError[] = parseJoiError(err.joiError);
      logger.error({ joiError });
    } else {
      logger.error(`${err.devMessage}`);
    }
  });
  next();
};
