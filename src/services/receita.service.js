import {
  listPublicReceitas,
  listReceitasByUser,
  findReceitaByIdForUser,
  insertReceita,
  deleteReceitaByIdForUser,
  isValidObjectId,
} from '../models/receita.model.js';

export function listPublicReceitasService() {
  return listPublicReceitas();
}

export function listMyReceitasService(userId) {
  return listReceitasByUser(userId);
}

export async function getReceitaService({ id, userId }) {
  if (!isValidObjectId(id)) return { status: 400, body: { error: 'ID inválido' } };

  const receita = await findReceitaByIdForUser(id, userId);
  if (!receita) return { status: 404, body: { error: 'Receita não encontrada' } };

  return { status: 200, body: receita };
}

export async function createReceitaService({ userId, data }) {
  await insertReceita({ userId, data });
  return { status: 201, body: { message: 'Receita adicionada com sucesso' } };
}

export async function deleteReceitaService({ id, userId }) {
  if (!isValidObjectId(id)) return { status: 400, body: { error: 'ID inválido' } };

  const result = await deleteReceitaByIdForUser(id, userId);
  if (result.deletedCount === 0) {
    return { status: 404, body: { error: 'Receita não encontrada' } };
  }
  return { status: 204 };
}
