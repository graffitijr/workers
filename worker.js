export default {
    // This function runs whenever a request hits your worker's URL.
    async fetch(request, env) {
        // Create a URL object so we can look at the path and query string easily.
        const url = new URL(request.url);

        // Simple CORS headers so your frontend (Pages or other) can call this worker freely.
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        };

        // Handle browser preflight for POSTs
        if (request.method === "OPTIONS") {
            return new Response(null, {status: 204, headers: corsHeaders});
        }

        // ------------------ SIGNUP (POST /post) ------------------  //  ----------------------------------------------------------------------------------------ONLY CHANGE AFTER THIS
        if (url.pathname === "/sign-up" && request.method === "POST") { // make pathname something like post to show its sending stuff to backend
            let body = await request.json();
            let {username, password} = body;

            let accountKey = "account_" + username.toLowerCase();

            let existing = await env.PublicContent.get(accountKey);

            if (existing) {
                return new Response("Username taken", {status: 400});
            } else {
                await env.PublicContent.put(accountKey, password);

                let OldAccounts = await env.PublicContent.get("accounts-list");
                await env.PublicContent.put("accounts-list", OldAccounts.unshift(username));

                return new Response("Account created", {status: 201});
            }

        }


        // ------------------ LOGIN (GET /login?username=..&password=..) ------------------
        // (I include this so your frontend can check login similarly)
        if (url.pathname === "/login" && request.method === "POST") {
            const {username, password} = await request.json();

            // VERY simple check
            const correctPassword = await env.KV.get("account_" + username);
            if (correctPassword !== password) {
                return new Response("Invalid login", {status: 401});
            }

            // Generate a random token
            const token = Math.random().toString(36).substring(2, 15);

            // Store token → username mapping
            await env.KV.put("session_" + token, username);

            // Send cookie to browser
            return new Response("Logged in!", {
                status: 200,
                headers: {
                    "Set-Cookie": `session=${token}; HttpOnly; Secure; SameSite=Strict`
                }
            });
        }
        if (url.pathname === "/get-accounts" && request.method === "GET") {
            const cookie = request.headers.get("Cookie"); // e.g., "session=a1b2c3d4"
            const token = cookie?.split("=")[1]; // get the token value
            const username = await env.KV.get("session_" + token);

            if (!username) return new Response("Not logged in", { status: 401 });

            const accounts = await env.PublicContent.get("accounts-list");

            let accountsToSend = accounts.filter(accounts => accounts !== username);

            return new Response(accountsToSend, {status: 200});
        }

        // Default response for any other route
        return new Response("Not found", {status: 404, headers: corsHeaders});
    }
};
