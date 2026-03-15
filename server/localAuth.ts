import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { localUsers, type LocalUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { Request, Response, NextFunction } from "express";

const scryptAsync = promisify(scrypt);

// Hash password using scrypt
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Compare passwords
export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Get local user by username
export async function getLocalUserByUsername(username: string): Promise<LocalUser | undefined> {
  const [user] = await db.select().from(localUsers).where(eq(localUsers.username, username));
  return user;
}

// Verify local user credentials
export async function verifyLocalUser(username: string, password: string): Promise<LocalUser | null> {
  const user = await getLocalUserByUsername(username);
  if (!user) return null;
  
  const isValid = await comparePasswords(password, user.password);
  return isValid ? user : null;
}

// Create a fake Replit-style user object from local user for compatibility
export function createCompatibleUser(localUser: LocalUser): any {
  return {
    claims: {
      sub: `local_${localUser.id}`,
      email: null,
      first_name: localUser.displayName?.split(' ')[0] || localUser.username,
      last_name: localUser.displayName?.split(' ').slice(1).join(' ') || null,
      profile_image_url: null,
    },
    access_token: 'local_token',
    refresh_token: null,
    expires_at: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
  };
}