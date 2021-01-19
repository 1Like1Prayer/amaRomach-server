import * as Joi from '@hapi/joi';
const joi_oid = require('joi-oid');

export const joiProductAddSchema = Joi.object({
  amount: Joi.number().min(1).required(),
  description: Joi.string().min(1).required(),
  name: Joi.string().alphanum().min(1).max(30).required(),
  price: Joi.number().min(1).required(),
});

export const joiProductEditSchema = Joi.object({
  amount: Joi.number().min(1),
  description: Joi.string().min(1),
  name: Joi.string().alphanum().min(1).max(30),
  price: Joi.number().min(1),
});

export const joiIdSchema = joi_oid.objectId().required();

const joiProductInCartSchema = Joi.object({
  amount: Joi.number().min(1).required(),
  name: Joi.string().alphanum().min(3).max(30).required(),
});

export const joiCheckOutSchema = Joi.array().items(joiProductInCartSchema);
