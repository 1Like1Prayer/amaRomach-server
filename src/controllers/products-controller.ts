import { Context } from 'koa';
import { Product, ProductModel } from '../db/models/product';
import { ProductInCart } from '../models/product-in-cart';
import { ServerError } from '../models/server-error';
import {
  joiCheckOutSchema,
  joiIdSchema,
  joiProductEditSchema,
  joiProductSchema,
} from '../validations/product-validation-schemas';

enum errorMessages {
  NOT_FOUND = 'product not found',
  NOT_VALID = 'product id not valid',
  INTERNAL = 'internal server error',
}

export const getProducts = async (ctx: Context) => {
  try {
    ctx.body = await ProductModel.find();
  } catch (err) {
    throw new ServerError(err.message, 500, errorMessages.INTERNAL);
  }
};
export const getProductById = async (ctx: Context) => {
  const { error, value } = joiIdSchema.validate(ctx.params.id);
  if (error) {
    throw new ServerError(error.message, 400, errorMessages.NOT_VALID, error.isJoi);
  }
  try {
    const product = await ProductModel.findById(value);
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
    ctx.body = await new ProductModel(value).save();
    ctx.status = 201;
  } catch (err) {
    throw new ServerError(err.message, 500, errorMessages.INTERNAL);
  }
};

export const editProduct = async (ctx: Context) => {
  const productChanges = ctx.request.body;
  const { error: err, value: id } = joiIdSchema.validate(ctx.params.id);
  if (err) {
    throw new ServerError(err.message, 400, errorMessages.NOT_VALID, err.isJoi);
  }
  const { error, value } = joiProductEditSchema.validate(productChanges);
  if (error) {
    throw new ServerError(error.message, 400, errorMessages.NOT_VALID, error.isJoi);
  }
  try {
    const product = await ProductModel.findByIdAndUpdate(id, value, {
      new: true,
    });
    productExistenceCheck(product, ctx);
  } catch (err) {
    throw new ServerError(err.message, 400, errorMessages.NOT_VALID);
  }
};

export const deleteProduct = async (ctx: Context) => {
  const { error, value } = joiIdSchema.validate(ctx.params.id);
  if (error) {
    throw new ServerError(error.message, 400, errorMessages.NOT_VALID, error.isJoi);
  }
  try {
    const product = await ProductModel.findByIdAndRemove(value);
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
  const session = await ProductModel.startSession();
  const productsAfterCheckout: Product[] = [];
  try {
    session.startTransaction();
    await Promise.all(
      value.map(async (cartProduct: ProductInCart) => {
        const product = await ProductModel.findOne({ name: cartProduct.name }).session(session);
        if (product && cartProduct.amount <= product.amount) {
          const updatedProduct = await ProductModel.findOneAndUpdate(
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

const productExistenceCheck = (product: Product, ctx: Context) => {
  if (!product) {
    ctx.body = errorMessages.NOT_FOUND;
    ctx.status = 404;
  } else {
    ctx.body = product;
  }
};
