import { z } from 'zod';
const registerUserSchema = z.object({
    name: z.string().regex(/^[a-zA-Z]+$/, "Name can only contain letters")
});

const result = registerUserSchema.safeParse({name: "Sumit Paul"});
if(!result.success) {
    console.log(result.error.issues[0].message);
}
