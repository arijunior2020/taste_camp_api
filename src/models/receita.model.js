import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';

export function listPublicReceitas() {
  return getDB().collection('receitas').find().toArray();
}

export function listReceitasByUser(userId) {
  return getDB().collection('receitas').find({ userId }).toArray();
}

export function findReceitaByIdForUser(id, userId) {
  return getDB().collection('receitas').findOne({
    _id: new ObjectId(id),
    userId,
  });
}

export function insertReceita({ userId, data }) {
  return getDB().collection('receitas').insertOne({
    ...data,
    userId,
    createdAt: new Date(),
  });
}

export function deleteReceitaByIdForUser(id, userId) {
  return getDB().collection('receitas').deleteOne({
    _id: new ObjectId(id),
    userId,
  });
}

export function isValidObjectId(id) {
  return ObjectId.isValid(id);
}
