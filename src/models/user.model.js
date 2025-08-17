import { getDB } from '../config/db.js';

export function findUserByEmail(email) {
  return getDB().collection('usuarios').findOne({ email });
}

export function createUser({ nome, email, senhaHash }) {
  return getDB().collection('usuarios').insertOne({
    nome,
    email,
    senha: senhaHash,
    createdAt: new Date(),
  });
}
