import { getDB } from '../config/db.js';

export function createSession({ token, userId, expiresAt }) {
  return getDB().collection('sessoes').insertOne({
    token,
    userId,
    createdAt: new Date(),
    expiresAt,
  });
}

export function findSessionByToken(token) {
  return getDB().collection('sessoes').findOne({ token });
}

export function deleteSessionByToken(token) {
  return getDB().collection('sessoes').deleteOne({ token });
}
