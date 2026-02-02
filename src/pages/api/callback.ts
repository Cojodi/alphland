import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { code, state } = req.query;
  const host = req.headers.host || "";

  if (!code) {
    return res.status(400).json({ error: "No code provided" });
  }

  // Determine which OAuth credentials to use based on the host
  const isProduction = host === "alph.land" || host === "www.alph.land";

  const clientId = isProduction
    ? process.env.OAUTH_CLIENT_ID_PROD
    : process.env.OAUTH_CLIENT_ID_DEV;

  const clientSecret = isProduction
    ? process.env.OAUTH_CLIENT_SECRET_PROD
    : process.env.OAUTH_CLIENT_SECRET_DEV;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "OAuth credentials not configured" });
  }

  try {
    // Exchange the code for an access token
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          redirect_uri: `https://${host}/api/callback`,
        }),
      },
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error("GitHub OAuth error:", tokenData);
      return res.status(400).json({ error: tokenData.error_description });
    }

    const { access_token, token_type } = tokenData;

    // Return the token to Decap CMS via postMessage
    // This HTML page will send the token back to the CMS window
    const script = `
      <script>
        (function() {
          function receiveMessage(e) {
            console.log("receiveMessage %o", e);
            window.opener.postMessage(
              'authorization:github:success:${JSON.stringify({ token: access_token, provider: "github" })}',
              e.origin
            );
            window.removeEventListener("message", receiveMessage, false);
          }
          window.addEventListener("message", receiveMessage, false);
          window.opener.postMessage("authorizing:github", "*");
        })();
      </script>
    `;

    res.setHeader("Content-Type", "text/html");
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>OAuth Callback</title>
        </head>
        <body>
          <p>Authorizing...</p>
          ${script}
        </body>
      </html>
    `);
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.status(500).json({ error: "Failed to exchange code for token" });
  }
}
