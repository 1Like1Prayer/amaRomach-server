import { Context } from 'koa';
import { Product, ProductInterface } from '../db/models/product';
import { ProductInCart } from '../models/product-in-cart';
import { ServerError } from '../models/server-error';
import { joiCheckOutSchema, joiProductSchema } from '../validations/product-validation-schemas';

enum errorMessages {
  NOT_FOUND = 'product not found',
  NOT_VALID = 'product id not valid',
  INTERNAL = 'internal server error',
}

export const getProducts = async (ctx: Context) => {
  try {
    ctx.body = await Product.find();
  } catch (err) {
    throw new ServerError(err.message, 500, errorMessages.INTERNAL);
  }
};
export const getProductById = async (ctx: Context) => {
  try {
    const product = await Product.findById(ctx.params.id);
    productExistenceCheck(product, ctx);
  } catch (err) {
    throw new ServerError(err.message, 400, errorMessages.NOT_VALID);
  }
};

export const addProduct = async (ctx: Context) => {
  const product = ctx.request.body;
  const { error, value } = joiProductSchema.validate(product, { abortEarly: false });
  if (error) {
    throw new ServerError(error.message, 400, errorMessages.NOT_VALID, error.isJoi);
  }
  try {
    ctx.body = await new Product(value).save();
    ctx.status = 201;
  } catch (err) {
    throw new ServerError(err.message, 500, errorMessages.INTERNAL);
  }
};

export const editProduct = async (ctx: Context) => {
  const productChanges = ctx.request.body;
  try {
    const product = await Product.findByIdAndUpdate(ctx.params.id, productChanges, { new: true });
    productExistenceCheck(product, ctx);
  } catch (err) {
    throw new ServerError(err.message, 400, errorMessages.NOT_VALID);
  }
};

export const deleteProduct = async (ctx: Context) => {
  try {
    const product = await Product.findByIdAndRemove(ctx.params.id);
    productExistenceCheck(product, ctx);
  } catch (err) {
    throw new ServerError(err.message, 400, errorMessages.NOT_VALID);
  }
};

export const checkOut = async (ctx: Context) => {
  const products = ctx.request.body;
  const { error, value } = joiCheckOutSchema.validate(products, { abortEarly: false });
  if (error) {
    throw new ServerError(error.message, 400, errorMessages.NOT_VALID, error.isJoi);
  }
  const session = await Product.startSession();
  const productsAfterCheckout: ProductInterface[] = [];
  try {
    session.startTransaction();
    await Promise.all(
      value.map(async (cartProduct: ProductInCart) => {
        const product = await Product.findOne({ name: cartProduct.name }).session(session);
        if (product && cartProduct.amount <= product.amount) {
          const updatedProduct = await Product.findOneAndUpdate(
            { name: cartProduct.name },
            { amount: product.amount - cartProduct.amount },
            { new: true, session },
          );
          productsAfterCheckout.push(updatedProduct);
        } else {
          throw new Error('checkout amount exceeding the product current available amount');
        }
      }),
    );
    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw new ServerError(err.message, 500, errorMessages.INTERNAL);
  }
  ctx.body = productsAfterCheckout;
};

const productExistenceCheck = (product: ProductInterface, ctx: Context) => {
  if (!product) {
    ctx.body = errorMessages.NOT_FOUND;
    ctx.status = 404;
  } else {
    ctx.body = product;
  }
};
