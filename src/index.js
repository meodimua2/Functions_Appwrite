const { authHandler } = require("./handlers/auth");

module.exports = async (context) => {
    const { log, error, req, res } = context;

    let payload = req.body;

    try {
        if (typeof payload === "string") {
            payload = JSON.parse(payload);
        }

        if (payload && typeof payload.body === "string") {
            payload = JSON.parse(payload.body);
        } else if (payload && typeof payload.body === "object") {
            payload = payload.body;
        }

        if (payload && typeof payload.data === "string") {
            payload = JSON.parse(payload.data);
        } else if (payload && typeof payload.data === "object") {
            payload = payload.data;
        }

        log("Final Payload: " + JSON.stringify(payload));

        context.payload = payload;

        return await authHandler(context);

    } catch (e) {
        error("Parse error: " + e.message);

        return res.json({
            success: false,
            message: "Invalid request payload"
        }, 400);
    }
};