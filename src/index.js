const { authHandler } = require("./handlers/auth");

module.exports = async (context) => {
    const { req, res, error } = context;

    try {
        let body = req.body;

        // 👉 chỉ parse JSON nếu là string
        if (typeof body === "string") {
            body = JSON.parse(body);
        }

        // 👉 unwrap nếu có data
        if (body?.data) {
            body = typeof body.data === "string"
                ? JSON.parse(body.data)
                : body.data;
        }

        // 👉 đảm bảo là object
        if (typeof body !== "object") {
            return res.json({ success: false, message: "Invalid body format" }, 400);
        }

        req.body = body;

        return await authHandler(context);

    } catch (err) {
        error("Parse error: " + err.message);

        return res.json({
            success: false,
            message: "Invalid request body"
        }, 400);
    }
};
