// index.js
import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import Joi from 'joi';
import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';

dotenv.config();

const app = express();
const port = process.env.PORT || 6000;
const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  console.error('Defina MONGO_URL no .env');
  process.exit(1);
}

app.use(cors());
app.use(express.json());

/* ============================
   Schemas Joi
============================ */
const receitaSchema = Joi.object({
  titulo: Joi.string().required(),
  ingredientes: Joi.string().required(),
  preparo: Joi.string().required(),
});

const usuarioSchemaSignUp = Joi.object({
  nome: Joi.string().required(),
  email: Joi.string().email().required(),
  senha: Joi.string().min(6).required(),
});

const usuarioSchemaSignIn = Joi.object({
  email: Joi.string().email().required(),
  senha: Joi.string().required(),
});

/* ============================
   Conexão MongoDB + Índices
============================ */
const mongoClient = new MongoClient(MONGO_URL);
let db;

async function ensureIndexes() {
  await db.collection('usuarios').createIndex({ email: 1 }, { unique: true });
  await db.collection('sessoes').createIndex({ token: 1 }, { unique: true });
  await db.collection('sessoes').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection('receitas').createIndex({ userId: 1 });
}

try {
  await mongoClient.connect();
  db = mongoClient.db(); // usa o DB da connection string
  await ensureIndexes();
  console.log('Conexão com o banco estabelecida com sucesso!');
} catch (err) {
  console.error('Falha ao conectar no MongoDB:', err);
  process.exit(1);
}

/* ============================
   Middleware de Autenticação
============================ */
async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const sessao = await db.collection('sessoes').findOne({ token });
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

/* ============================
   Rotas Públicas
============================ */

// (Opcional) Healthcheck
app.get('/status', (_req, res) => res.json({ ok: true }));

// Lista pública de receitas (se quiser escopo por usuário, use a rota /me/receitas)
app.get('/receitas', async (_req, res) => {
  try {
    const data = await db.collection('receitas').find().toArray();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* ============================
   Rotas Protegidas (Auth)
============================ */

// Lista receitas do usuário logado
app.get('/me/receitas', auth, async (req, res) => {
  try {
    const receitas = await db.collection('receitas')
      .find({ userId: req.userId })
      .toArray();
    return res.json(receitas);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Obter uma receita específica do usuário
app.get('/receitas/:id', auth, async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    const receita = await db.collection('receitas').findOne({
      _id: new ObjectId(id),
      userId: req.userId,
    });

    if (!receita) {
      // 404 para não vazar existência de recurso de outro usuário
      return res.status(404).json({ error: 'Receita não encontrada' });
    }

    return res.json(receita);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Criar receita (vinculada ao usuário logado)
app.post('/receitas', auth, async (req, res) => {
  const { error } = receitaSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const mensagens = error.details.map(d => d.message);
    return res.status(422).json(mensagens);
  }

  try {
    await db.collection('receitas').insertOne({
      ...req.body,
      userId: req.userId,
      createdAt: new Date(),
    });
    return res.status(201).json({ message: 'Receita adicionada com sucesso' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Excluir receita (somente do dono)
app.delete('/receitas/:id', auth, async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    const result = await db.collection('receitas').deleteOne({
      _id: new ObjectId(id),
      userId: req.userId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Receita não encontrada' });
    }

    return res.sendStatus(204); // sem body
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* ============================
   Rotas de Usuário (Auth)
============================ */

app.post('/sign-up', async (req, res) => {
  const usuario = req.body;

  const { error } = usuarioSchemaSignUp.validate(usuario, { abortEarly: false });
  if (error) {
    const mensagens = error.details.map(d => d.message);
    return res.status(422).json(mensagens);
  }

  try {
    const jaExiste = await db.collection('usuarios').findOne({ email: usuario.email });
    if (jaExiste) {
      return res.status(409).json({ error: 'E-mail já cadastrado' });
    }

    const senhaHash = await bcrypt.hash(usuario.senha, 10);

    await db.collection('usuarios').insertOne({
      nome: usuario.nome,
      email: usuario.email,
      senha: senhaHash,
      createdAt: new Date(),
    });

    return res.status(201).json({ message: 'Usuário adicionado com sucesso' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/sign-in', async (req, res) => {
  const { email, senha } = req.body;

  const { error } = usuarioSchemaSignIn.validate({ email, senha }, { abortEarly: false });
  if (error) {
    const mensagens = error.details.map(d => d.message);
    return res.status(422).json(mensagens);
  }

  try {
    const usuario = await db.collection('usuarios').findOne({ email });
    // Resposta genérica evita enumeração de usuários
    if (!usuario) return res.status(401).json({ error: 'Credenciais inválidas' });

    const ok = await bcrypt.compare(senha, usuario.senha);
    if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = uuid();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dias

    await db.collection('sessoes').insertOne({
      token,
      userId: usuario._id,
      createdAt: now,
      expiresAt,
    });

    return res.status(200).json({
      message: 'Usuário logado com sucesso',
      token,
      usuario: { nome: usuario.nome, email: usuario.email },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Logout (revogação da sessão)
app.post('/sign-out', auth, async (req, res) => {
  try {
    await db.collection('sessoes').deleteOne({ token: req.token });
    return res.sendStatus(204);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* ============================
   Start do servidor
============================ */
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
