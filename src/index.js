const router = require("./router");

module.exports = async (context) => {
    const { log, error, req } = context;

    // Kiểm tra env vars cần thiết
    const requiredEnv = ['APPWRITE_DATABASE_ID', 'BOT_TOKEN', 'JWT_SECRET', 'RIOT_API_KEY'];
    const missing = requiredEnv.filter(key => !process.env[key]);
    if (missing.length > 0) {
        error(`Missing environment variables: ${missing.join(', ')}`);
        return context.res.json({ success: false, message: "Server configuration error" }, 500);
    }

    let payload = req.body;

    try {
        if (typeof payload === "string") payload = JSON.parse(payload);
        if (payload?.body) payload = typeof payload.body === "string" ? JSON.parse(payload.body) : payload.body;
        if (payload?.data) payload = typeof payload.data === "string" ? JSON.parse(payload.data) : payload.data;

        log("Incoming Action: " + (payload?.action || 'default'));
        context.payload = payload;

        return await router(context);

    } catch (e) {
        error("Parse error: " + e.message);
        return context.res.json({ success: false, message: "Invalid payload" }, 400);
    }
};