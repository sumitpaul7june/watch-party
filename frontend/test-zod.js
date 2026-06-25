import { z } from 'zod';
const registerUserSchema = z.object({
    name: z.string().trim().min(3).max(100).regex(/^[a-zA-Z\s]+$/)
});

const result = registerUserSchema.safeParse({name: ""});
console.log(result.error.issues);
