const { authHandler } = require("./handlers/auth");

function parseBody(rawBody) {
    if (!rawBody) return {};

    // Nếu là object rồi → dùng luôn
    if (typeof rawBody === "object") return rawBody;

    // Nếu là string → thử JSON trước
    if (typeof rawBody === "string") {
        try {
            return JSON.parse(rawBody);
        } catch {
            // không phải JSON → parse dạng form
            const params = new URLSearchParams(rawBody);
            const obj = {};

            for (const [key, value] of params.entries()) {
                obj[key] = value;
            }

            return obj;
        }
    }

    return {};
}

module.exports = async (context) => {
    const { req, res, error } = context;

    try {
        const parsedBody = parseBody(req.body);

        // Nếu có body.data → unwrap thêm 1 lớp
        if (parsedBody?.data) {
            try {
                parsedBody.data = typeof parsedBody.data === "string"
                    ? JSON.parse(parsedBody.data)
                    : parsedBody.data;
            } catch {
                // ignore lỗi data
            }
        }

        // gắn lại body sạch
        req.body = parsedBody.data || parsedBody;

        return await authHandler(context);

    } catch (err) {
        error("Main Index Error: " + err.message);

        return res.json({
            success: false,
            message: "Internal Server Error"
        }, 500);
    }
};
