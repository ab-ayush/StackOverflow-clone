export const imageUrl = (path: string) =>
  path.startsWith("http") ? path : `${process.env.NEXT_PUBLIC_API_URL}${path}`;