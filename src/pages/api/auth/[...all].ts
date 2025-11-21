/**
 * Better Auth API routes handler
 * Handles all authentication endpoints via better-auth
 */
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export default toNextJsHandler(auth);
