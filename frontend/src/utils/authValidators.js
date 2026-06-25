import z from 'zod';

// --- VALIDATION LAYER ---
// Strict rules for forms. We check these before hitting the backend
// to save server resources and provide instant feedback to the user.

export const registerUserSchema = z.object({
    name: z.string()
        .trim()
        .min(3, "Name must be at least 3 characters long.")
        .max(100, "Name must be no more than 100 characters")
        .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),

    username: z.string()
        .min(3, "Username must")
        .max(20, "Username cannot be longer than 20 characters")
        .regex(/[a-zA-Z]/, "Username must contain at least one letter")
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),

    email: z.string().email("Please enter a valid email address"),

    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[\W_]/, "Password must contain at least one special character"),

    confirmPassword: z.string()

}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
})

export const loginUserSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required")
});