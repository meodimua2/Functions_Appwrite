const { authHandler } = require("./handlers/auth");

module.exports = async (context) => {
    const { log, error, req } = context;

    let payload = req.body;

    try {
        if (typeof payload === "string") payload = JSON.parse(payload);
        if (payload?.body) payload = typeof payload.body === "string" ? JSON.parse(payload.body) : payload.body;
        if (payload?.data) payload = typeof payload.data === "string" ? JSON.parse(payload.data) : payload.data;

        log("Final Payload: " + JSON.stringify(payload));

        // ❗ KHÔNG sửa req.body nữa
        context.payload = payload;

        return await authHandler(context);

    } catch (e) {
        error("Parse error: " + e.message);
        return context.res.json({ success: false }, 400);
    }
};
