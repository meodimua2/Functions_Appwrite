const { JwtService } = require("../security/jwt.service");

async function authMiddleware(context) {
    const { payload, req, res, log } = context;
    const { JWT_SECRET } = process.env;

    if (!JWT_SECRET) {
        return res.json({ success: false, message: "Server config error" }, 500);
    }

    // Lấy token từ payload hoặc header
    let token = payload.token;
    if (!token && req.headers.authorization) {
        token = req.headers.authorization.replace(/^Bearer\s+/, '');
    }

    if (!token) {
        return res.json({ success: false, message: "Thiếu token" }, 401);
    }

    try {
        const jwt = new JwtService(JWT_SECRET);
        const decoded = jwt.verify(token);

        if (!decoded || !decoded.userId) {
            log("Token không hợp lệ hoặc hết hạn");
            return res.json({ success: false, message: "Token không hợp lệ" }, 401);
        }

        // Inject userId vào payload để các handler dùng trực tiếp
        context.userId = String(decoded.userId);
        context.payload.userId = String(decoded.userId);
        return null;

    } catch (err) {
        log("Auth middleware error: " + err.message);
        return res.json({ success: false, message: "Lỗi xác thực" }, 401);
    }
}

module.exports = { authMiddleware };