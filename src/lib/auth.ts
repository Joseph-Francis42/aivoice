import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { db } from "./db";

const SECRET = process.env.JWT_SECRET || "talkmock_super_secret_key_123456789";

export interface TokenPayload {
  userId: string;
  username: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  try {
    const user = await db.user.findUnique({
      where: { id: payload.userId },
    });
    return user;
  } catch (error) {
    console.error("Error fetching user in getCurrentUser:", error);
    return null;
  }
}
