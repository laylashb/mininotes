import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const noteSchema = z.object({
  titre: z.string().min(1).max(120),
  contenu: z.string().max(5000),
});
