/**
 * Better Auth API routes handler
 * Handles all authentication endpoints via better-auth
 */
import { auth } from "@/lib/auth";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Pass the request to better-auth's API handler
    const response = await auth.api.handler(req, res);
    return response;
  } catch (error) {
    console.error("Better Auth API error:", error);

    // Return a proper error response
    if (!res.headersSent) {
      return res.status(500).json({
        error: "Authentication service error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
