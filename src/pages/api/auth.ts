import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const host = req.headers.host || "";

  // Determine which OAuth credentials to use based on the host
  const isProduction = host === "alph.land" || host === "www.alph.land";

  const clientId = isProduction
    ? process.env.OAUTH_CLIENT_ID_PROD
    : process.env.OAUTH_CLIENT_ID_DEV;

  if (!clientId) {
    return res.status(500).json({ error: "OAuth client ID not configured" });
  }

  // GitHub OAuth authorization URL
  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", `https://${host}/api/callback`);
  authUrl.searchParams.set("scope", "public_repo");
  authUrl.searchParams.set("state", (req.query.state as string) || "");

  // Redirect to GitHub OAuth
  res.redirect(authUrl.toString());
}
