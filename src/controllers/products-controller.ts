import { Product, ProductInterface } from '../data/models/product';
import { ProductInCart } from '../data/models/product-in-cart';
import { ServerError } from '../models/server-error';
import { logger } from '../utils/logs/logger';
import { joiCheckOutSchema, joiProductSchema } from '../validations/product-validation-schemas';

enum errorMessages {
    NOT_FOUND = 'product not found',
    NOT_VALID = 'product id not valid',
    INTERNAL = 'internal server error',
}

export const getProducts = async (ctx: any) => {
    try {
        ctx.body = await Product.find();
    } catch (err) {
        throw new ServerError(err.message, 500, errorMessages.INTERNAL);
    }
};
export const getProductById = async (ctx: any) => {
    try {
        const product = await Product.findById(ctx.params.id);
        productExistenceCheck(product, ctx);
    } catch (err) {
        throw new ServerError(err.message, 400, errorMessages.NOT_VALID);
    }
};

export const addProduct = async (ctx: any) => {
    const product = ctx.request.body;
    const { error, value } = joiProductSchema.validate(product);
    logger.info(value);
    if (error) {
        logger.info(`joi error - ${error}`);
        ctx.body = error.message;
        ctx.status = 400;
        return;
    }
    try {
        ctx.body = await new Product(product).save();
        ctx.status = 201;
    } catch (err) {
        throw new ServerError(err.message, 500, errorMessages.INTERNAL);
    }
};

export const editProduct = async (ctx: any) => {
    try {
        const product = await Product.findByIdAndUpdate(ctx.params.id, { price: 400 }, { new: true });
        productExistenceCheck(product, ctx);
    } catch (err) {
        throw new ServerError(err.message, 400, errorMessages.NOT_VALID);
    }
};

export const deleteProduct = async (ctx: any) => {
    try {
        const product = await Product.findByIdAndRemove(ctx.params.id);
        productExistenceCheck(product, ctx);
    } catch (err) {
        throw new ServerError(err.message, 400, errorMessages.NOT_VALID);
    }
};

export const checkOut = async (ctx: any) => {
    const products = ctx.request.body;
    products.map(async (cartProduct: ProductInCart) => {
        const { error } = joiCheckOutSchema.validate(cartProduct);
        if (error) {
            logger.info(`joi error - ${error}`);
            ctx.body = error.message;
            ctx.status = 400;
            return;
        }
        try {
            const product = await Product.findOne({ name: cartProduct.name });
            if (product && cartProduct.amount <= product.amount) {
                await Product.findOneAndUpdate({ name: cartProduct.name },
                    { amount: product.amount - cartProduct.amount }, { new: true });
            } else {
                logger.info('checkout amount exceeding the product current available amount');
            }
        } catch (err) {
            throw new ServerError(err.message, 500, errorMessages.INTERNAL);
        }
    });
    await getProducts(ctx);
};

const productExistenceCheck = (product: ProductInterface, ctx: any) => {
    if (!product) {
        ctx.body = errorMessages.NOT_FOUND;
        ctx.status = 404;
    } else {
        ctx.body = product;
    }
};
