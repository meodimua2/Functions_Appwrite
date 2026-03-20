const { authHandler } = require("./handlers/auth"); 

module.exports = async (context) => {
    const { req, res, error, log } = context;

    let payload = req.body;

    try {
        if (typeof payload === "string") payload = JSON.parse(payload);
        
        if (payload && payload.body) {
            payload = typeof payload.body === "string" ? JSON.parse(payload.body) : payload.body;
        }
        
        if (payload && payload.data) {
            payload = typeof payload.data === "string" ? JSON.parse(payload.data) : payload.data;
        }
    } catch (e) {
        error("JSON Parse Error: " + e.message);
        return res.json({ success: false, message: "Invalid JSON structure" }, 400);
    }

    context.req.body = payload;

    try {
        return await authHandler(context);
    } catch (err) {
        error("Main Index Error: " + err.message);
        return res.json({ success: false, message: "Internal Server Error" }, 500);
    }
};
