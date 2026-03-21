const { TelegramAuthService } = require("../service/auth.service");
const { UserService } = require("../service/user.service");
const { CacheService } = require("../security/cache.service");
const { RateLimitService } = require("../security/rateLimit.service");
const { JwtService } = require("../security/jwt.service");

const cache = new CacheService();
const rateLimitIP = new RateLimitService(500);
const rateLimitUser = new RateLimitService(1000);
const userService = new UserService();

async function authHandler({ payload, req, res, log, error }) {
    const { BOT_TOKEN, JWT_SECRET } = process.env;

    if (!BOT_TOKEN) {
        return res.json({ success: false, message: "Server config error" }, 500);
    }

    const initData = payload?.initData;
    if (!initData) {
        return res.json({ success: false, message: "Missing initData" }, 400);
    }

    const ip = req.headers["x-forwarded-for"] || "unknown";

    if (!rateLimitIP.check(ip)) {
        return res.json({ success: false, message: "Too many requests" }, 429);
    }

    const auth = new TelegramAuthService(BOT_TOKEN);
    const result = auth.verify(initData);

    if (!result?.isValid) {
        return res.json({ success: false, message: "Unauthorized" }, 401);
    }

    const telegramId = String(result.userId);

    if (!rateLimitUser.check(telegramId)) {
        return res.json({ success: false, message: "Too many requests" }, 429);
    }

    const cached = cache.getCache(telegramId);
    if (cached) {
        return res.json({ success: true, ...cached });
    }

    try {
        const user = await userService.getOrCreateUser({ id: telegramId });

        const jwtService = new JwtService(JWT_SECRET);

        // JWT chỉ giữ thông tin định danh (Nhỏ gọn)
        const token = jwtService.sign({
            userId: user.userId,
            tgId: telegramId
        });

        // ResponseData trả về toàn bộ thông tin để Frontend hiển thị
        const responseData = {
            userId: user.userId,
            telegramId: user.telegramId,
            status: user.status,
            balanceTrx: user.balanceTrx, // Lấy từ kết quả của userService
            addresstrx: user.addresstrx, // Lấy từ kết quả của userService
            token: token
        };

        // Lưu Cache (Bạn nên lưu cả cục responseData để lần sau lấy cho nhanh)
        cache.setCache(telegramId, responseData);

        log(`User ${telegramId} logged in with balance: ${user.balanceTrx}`);
        
        return res.json({ success: true, ...responseData });

    } catch (err) {
        error("Auth handler error: " + err.message);
        return res.json({ success: false, message: "Internal Server Error" }, 500);
    }
}

module.exports = { authHandler };