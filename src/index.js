const { authHandler } = require("./handlers/auth"); 

module.exports = async (context) => {
    const { req, res, error } = context;

    let body = req.body;
    try {
        if (typeof body === "string") body = JSON.parse(body);
        if (body && body.data) {
            body = typeof body.data === "string" ? JSON.parse(body.data) : body.data;
        }
    } catch (e) {
        return res.json({ success: false, message: "Invalid JSON body" }, 400);
    }

    context.req.body = body;

    try {
        return await authHandler(context);
    } catch (err) {
        error("Main Index Error: " + err.message);
        return res.json({ success: false, message: "Internal Server Error" }, 500);
    }
};