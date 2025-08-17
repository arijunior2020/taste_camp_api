import { findSessionByToken } from '../models/session.model.js';

export async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(/\s+/);

    // Aceita "Bearer" case-insensitive
    if (!/bearer/i.test(scheme || '') || !token) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const sessao = await findSessionByToken(token);
    if (!sessao) return res.status(401).json({ error: 'Sessão inválida' });
    if (sessao.expiresAt && sessao.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Sessão expirada' });
    }

    req.userId = sessao.userId;
    req.token = token; // útil para logout
    next();
  } catch (e) {
    return res.status(500).json({ error: 'Falha na autenticação' });
  }
}
