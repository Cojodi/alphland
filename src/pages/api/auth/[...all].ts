/**
 * Better Auth API routes handler
 * Handles all authentication endpoints:
 * - POST /api/auth/sign-up/email
 * - POST /api/auth/sign-in/email
 * - GET  /api/auth/sign-in/google
 * - GET  /api/auth/callback/google
 * - POST /api/auth/sign-out
 * - GET  /api/auth/session
 * - POST /api/auth/forget-password
 * - POST /api/auth/reset-password
 * - GET  /api/auth/verify-email
 */
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import type { NextApiRequest, NextApiResponse } from "next";

export default toNextJsHandler(auth);
