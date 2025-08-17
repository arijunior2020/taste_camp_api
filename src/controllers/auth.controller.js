import { signUpSchema, signInSchema } from '../schemas/auth.schema.js';
import { signUpService, signInService, signOutService } from '../services/auth.service.js';

export async function signUp(req, res) {
  const { error } = signUpSchema.validate(req.body, { abortEarly: false });
  if (error) return res.status(422).json(error.details.map(d => d.message));

  try {
    const result = await signUpService(req.body);
    return result.status === 204 ? res.sendStatus(204) : res.status(result.status).json(result.body);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function signIn(req, res) {
  const { error } = signInSchema.validate(req.body, { abortEarly: false });
  if (error) return res.status(422).json(error.details.map(d => d.message));

  try {
    const result = await signInService(req.body);
    return res.status(result.status).json(result.body);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function signOut(req, res) {
  try {
    const result = await signOutService(req.token);
    return result.status === 204 ? res.sendStatus(204) : res.status(result.status).json(result.body);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
