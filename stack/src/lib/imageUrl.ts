// stored image paths look like "/uploads/posts/<name>.jpg"; prefix them with the backend URL
export const imageUrl = (path: string) =>
    `${(process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "")}${path}`;