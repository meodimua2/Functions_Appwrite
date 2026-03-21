// index.js
const { authHandler } = require("./handlers/auth"); 

module.exports = async (context) => {
    const { log, error, req } = context; // req ở đây là bản gốc từ Appwrite

    log("--- START DEBUG ---");
    let payload = req.body;

    try {
        if (typeof payload === "string") payload = JSON.parse(payload);
        if (payload && payload.body) {
            payload = typeof payload.body === "string" ? JSON.parse(payload.body) : payload.body;
        }
        if (payload && payload.data) {
            payload = typeof payload.data === "string" ? JSON.parse(payload.data) : payload.data;
        }

        log("6. Final Payload to Handler: " + JSON.stringify(payload));
        
        // CẬP NHẬT: Gán trực tiếp vào cả 2 nơi cho chắc chắn
        context.req.body = payload;
        req.body = payload; 

        // Truyền nguyên context vào
        return await authHandler(context);

    } catch (e) {
        error("7. Parse Error Detail: " + e.message);
        return context.res.json({ success: false, message: e.message }, 400);
    }
};
