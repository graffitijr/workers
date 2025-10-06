//Back End template - made my NOAH RICHARDS

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

        async function GenerateAssignAndReturnToken(account_name){
            let NewToken = Math.random().toString(36).substring(6)

            await env.PublicData.set(`Token_${NewToken}`, account_name);

            return NewToken;
        }

        // Handle browser preflight for POSTs
        if (request.method === "OPTIONS") {
            return new Response(null, {status: 204, headers: corsHeaders});
        }

        try {
            if (url.pathname === "/sign-up" && request.method === "POST") {
                let body = await request.json();

                if (!body.name) {
                    return new Response("cannot create account with no name", {status: 400, headers: corsHeaders});
                }
                if (body.name.length > 12) {
                    return new Response("name too long - max length 12", {status: 400, headers: corsHeaders});
                }

                let OldAccounts = await env.PublicData.get("all_accounts");
                let accounts = OldAccounts ? JSON.parse(OldAccounts) : [];

                if (accounts.includes(body.name)) {
                    return new Response("account already exists", {status: 400, headers: corsHeaders});
                }

                await env.PublicData.set(`account_${body.name}`, body.password);

                accounts.unshift(body.name);
                await env.PublicData.set("all_accounts", JSON.stringify(accounts));

                return new Response("account created", {status: 201, headers: corsHeaders});
            }

            if (url.pathname === "/login" && request.method === "POST") {
                let body = await request.json();

                let CorrectPassword = await env.PublicData.get(`account_${body.name}`);
                if (CorrectPassword === body.password) {
                    let token = await GenerateAssignAndReturnToken(body.name);
                    return new Response(JSON.stringify({token}), {status: 200, headers: corsHeaders});
                }
                return new Response("Login failed", {status: 401, headers: corsHeaders});
            }

            return new Response("Not found", {status: 404, headers: corsHeaders});
        } catch (err) {
            return new Response("Internal server error: " + err.message, {status: 500, headers: corsHeaders});
        }


        // Default response for any other route
        return new Response("Not found", {status: 404, headers: corsHeaders});
    }
};
