import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import Joi from 'joi';
import bcrypt from 'bcrypt';

dotenv.config();

const app = express();
const port = process.env.PORT || 6000;
const MONGO_URL = process.env.MONGO_URL;

app.use(cors());
app.use(express.json());

// --- Schemas Joi ---
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

// --- Conexão MongoDB e start do servidor ---
const mongoClient = new MongoClient(MONGO_URL);

let db;
try {
  await mongoClient.connect();
  db = mongoClient.db(); // usa o DB da connection string
  console.log('Conexão com o banco estabelecida com sucesso!');
} catch (err) {
  console.error('Falha ao conectar no MongoDB:', err);
  process.exit(1);
}

// --- Rotas Receitas ---

app.get('/receitas', async (req, res) => {
  try {
    const data = await db.collection('receitas').find().toArray();
    return res.send(data);
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

app.get('/receitas/:id', async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    return res.status(400).send('ID inválido.');
  }
  try {
    const receita = await db.collection('receitas').findOne({ _id: new ObjectId(id) });
    if (!receita) return res.status(404).send('Receita não encontrada.');
    return res.send(receita);
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

app.post('/receitas', async (req, res) => {
  const receita = req.body;

  const { error } = receitaSchema.validate(receita, { abortEarly: false });
  if (error) {
    const mensagens = error.details.map((d) => d.message);
    return res.status(422).send(mensagens);
  }

  try {
    await db.collection('receitas').insertOne({
      ...receita,
      createdAt: new Date(),
    });
    return res.status(201).send('Receita adicionada com sucesso!');
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

app.delete('/receitas/:id', async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    return res.status(400).send('ID inválido.');
  }

  try {
    const result = await db.collection('receitas').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).send('Essa receita não existe.');
    }
    // 204 não deve ter body, então só status:
    return res.sendStatus(204);
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

// --- Rotas Usuário ---

app.post('/sign-up', async (req, res) => {
  const usuario = req.body;

  const { error } = usuarioSchemaSignUp.validate(usuario, { abortEarly: false });
  if (error) {
    const mensagens = error.details.map((d) => d.message);
    return res.status(422).send(mensagens);
  }

  try {
    const jaExiste = await db.collection('usuarios').findOne({ email: usuario.email });
    if (jaExiste) {
      return res.status(409).send('E-mail já cadastrado.');
    }

    const senhaHash = await bcrypt.hash(usuario.senha, 10);

    await db.collection('usuarios').insertOne({
      nome: usuario.nome,
      email: usuario.email,
      senha: senhaHash,
      createdAt: new Date(),
    });

    return res.status(201).send('Usuário adicionado com sucesso!');
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

app.post('/sign-in', async (req, res) => {
  const { email, senha } = req.body;

  const { error } = usuarioSchemaSignIn.validate({ email, senha }, { abortEarly: false });
  if (error) {
    const mensagens = error.details.map((d) => d.message);
    return res.status(422).send(mensagens);
  }

  try {
    const usuario = await db.collection('usuarios').findOne({ email });
    if (!usuario) {
      return res.status(404).send('Usuário não encontrado.');
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).send('Senha incorreta.');
    }

    // Aqui você poderia emitir um token JWT, se desejar.
    return res.status(200).send('Login realizado com sucesso!');
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
