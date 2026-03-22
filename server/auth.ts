import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Express, RequestHandler } from "express";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;

  if (process.env.DATABASE_URL) {
    const pgStore = connectPg(session);
    const sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      ttl: sessionTtl / 1000,
      tableName: "sessions",
    });
    return session({
      secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: sessionTtl,
      },
    });
  } else {
    // Fallback to memory store (development without DATABASE_URL)
    return session({
      secret: "dev-secret",
      resave: false,
      saveUninitialized: false,
    });
  }
}

export async function setupAuth(app: Express) {
  app.use(getSession());
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (!(req.session as any).userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};
