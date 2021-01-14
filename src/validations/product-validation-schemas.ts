import * as Joi from '@hapi/joi';

export const joiProductSchema = Joi.object({
        amount: Joi.number()
            .min(1)
            .required(),
        description: Joi.string()
            .min(1)
            .required(),
        name: Joi.string()
            .alphanum()
            .min(1)
            .max(30)
            .required(),
        price: Joi.number()
            .min(1)
            .required(),
    },
);
export const joiCheckOutSchema = Joi.object({
    amount: Joi.number()
        .min(1)
        .required(),
    name: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required(),
});
