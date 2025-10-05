export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://social-media-app-e0s.pages.dev",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // ------------------ SIGNUP ------------------
    if (url.pathname === "/sign-up" && request.method === "POST") {
      const { username, password } = await request.json();
      const accountKey = "account_" + username.toLowerCase();

      const existing = await env.PublicContent.get(accountKey);
      if (existing || username === "") {
        return new Response("Username taken", { status: 400, headers: corsHeaders });
      }

      // Save account
      await env.PublicContent.put(accountKey, password);

      // Update accounts list
      let oldAccounts = await env.PublicContent.get("accounts-list");
      let accounts = oldAccounts ? JSON.parse(oldAccounts) : [];
      accounts.push(username);
      await env.PublicContent.put("accounts-list", JSON.stringify(accounts));

      return new Response("Account created", { status: 200, headers: corsHeaders });
    }

    // ------------------ LOGIN ------------------
    if (url.pathname === "/login" && request.method === "POST") {
      const { username, password } = await request.json();
      const correctPassword = await env.PublicContent.get("account_" + username.toLowerCase());

      if (correctPassword !== password) {
        return new Response("Invalid login", { status: 401, headers: corsHeaders });
      }

      const token = Math.random().toString(36).substring(2);
      await env.PublicContent.put("session_" + token, username);

      return new Response("Logged in!", {
        status: 200,
        headers: {
          ...corsHeaders,
          "Set-Cookie": `session=${token}; HttpOnly; Secure; SameSite=Strict`
        }
      });
    }

    // ------------------ GET ACCOUNTS ------------------
    if (url.pathname === "/get-accounts" && request.method === "GET") {
      const cookie = request.headers.get("Cookie");
      const token = cookie?.split("=")[1];
      const username = await env.PublicContent.get("session_" + token);

      if (!username) return new Response("Not logged in", { status: 401, headers: corsHeaders });

      const accountsJson = await env.PublicContent.get("accounts-list");
      const accounts = accountsJson ? JSON.parse(accountsJson) : [];
      const accountsToSend = accounts.filter(acc => acc !== username);

      return new Response(JSON.stringify(accountsToSend), { status: 200, headers: corsHeaders });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders });
  }
};
