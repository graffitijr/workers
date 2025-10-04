export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        };

        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        //handle user posting contenta

        if (url.pathname === "/post-content" && request.method === "POST") {
            let { text } = await request.json();

            let postKey = "post_"+Date.now();

            await env.PublicContent.put(postKey, text);

            const postsListRaw = await env.PublicContent.get("all_posts") || "[]";
            const postsList = JSON.parse(postsListRaw);

            // add new key to the front (latest first)
            postsList.unshift(postKey);

            // save updated list
            await env.PublicContent.put("all_posts", JSON.stringify(postsList));

            return new Response("Posted!", { status: 200, headers: corsHeaders })
        }

        if (url.pathname == "/get-content" && request.method === "GET") {
            const postsListRaw = await env.PublicContent.get("all_posts") || "[]";
            const postsList = JSON.parse(postsListRaw);

            // fetch all post contents
            const allPosts = [];
            for (const key of postsList) {
                const content = await env.PublicContent.get(key);
                if (content) allPosts.push(content);
            }

            // return all posts as a single string (or JSON if you prefer)
            return new Response(allPosts.join("<br>"), { status: 200, headers: corsHeaders });
        }
        return new Response("Not found", { status: 404, headers: corsHeaders });
    }
}
