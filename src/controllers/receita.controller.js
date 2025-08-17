import { receitaSchema } from '../schemas/receita.schema.js';
import {
  listPublicReceitasService,
  listMyReceitasService,
  getReceitaService,
  createReceitaService,
  deleteReceitaService,
} from '../services/receita.service.js';

export async function listPublic(req, res) {
  try {
    const data = await listPublicReceitasService();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function listMine(req, res) {
  try {
    const data = await listMyReceitasService(req.userId);
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getOne(req, res) {
  try {
    const result = await getReceitaService({ id: req.params.id, userId: req.userId });
    return result.status === 204 ? res.sendStatus(204) : res.status(result.status).json(result.body);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function createOne(req, res) {
  const { error } = receitaSchema.validate(req.body, { abortEarly: false });
  if (error) return res.status(422).json(error.details.map(d => d.message));

  try {
    const result = await createReceitaService({ userId: req.userId, data: req.body });
    return res.status(result.status).json(result.body);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function deleteOne(req, res) {
  try {
    const result = await deleteReceitaService({ id: req.params.id, userId: req.userId });
    return result.status === 204 ? res.sendStatus(204) : res.status(result.status).json(result.body);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
