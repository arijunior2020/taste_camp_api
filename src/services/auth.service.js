import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { createUser, findUserByEmail } from '../models/user.model.js';
import { createSession, deleteSessionByToken } from '../models/session.model.js';

export async function signUpService({ nome, email, senha }) {
  const jaExiste = await findUserByEmail(email);
  if (jaExiste) return { status: 409, body: { error: 'E-mail já cadastrado' } };

  const senhaHash = await bcrypt.hash(senha, 10);
  await createUser({ nome, email, senhaHash });

  return { status: 201, body: { message: 'Usuário adicionado com sucesso' } };
}

export async function signInService({ email, senha }) {
  const usuario = await findUserByEmail(email);
  if (!usuario) return { status: 401, body: { error: 'Credenciais inválidas' } };

  const ok = await bcrypt.compare(senha, usuario.senha);
  if (!ok) return { status: 401, body: { error: 'Credenciais inválidas' } };

  const token = uuid();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

  await createSession({ token, userId: usuario._id, expiresAt });

  return {
    status: 200,
    body: {
      message: 'Usuário logado com sucesso',
      token,
      usuario: { nome: usuario.nome, email: usuario.email },
    },
  };
}

export async function signOutService(token) {
  await deleteSessionByToken(token);
  return { status: 204 };
}
