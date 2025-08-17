import Joi from 'joi';

export const receitaSchema = Joi.object({
  titulo: Joi.string().required(),
  ingredientes: Joi.string().required(),
  preparo: Joi.string().required(),
});
