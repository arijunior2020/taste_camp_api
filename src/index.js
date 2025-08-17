// src/index.js
import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';

const port = process.env.PORT || 6000;

async function bootstrap() {
  await connectDB();
  app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
  });
}

bootstrap().catch((err) => {
  console.error('Falha ao iniciar a aplicação:', err);
  process.exit(1);
});
