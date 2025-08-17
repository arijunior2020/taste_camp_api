import Joi from 'joi';

export const signUpSchema = Joi.object({
  nome: Joi.string().required(),
  email: Joi.string().email().required(),
  senha: Joi.string().min(6).required(),
});

export const signInSchema = Joi.object({
  email: Joi.string().email().required(),
  senha: Joi.string().required(),
});
