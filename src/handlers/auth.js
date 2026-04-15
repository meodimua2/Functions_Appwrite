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

    // stringId chính là Telegram ID lấy từ kết quả verify
    const stringId = String(result.userId);

    if (!rateLimitUser.check(stringId)) {
        return res.json({ success: false, message: "Too many requests" }, 429);
    }

    const cached = cache.getCache(stringId);
    if (cached) {
        return res.json({ success: true, ...cached });
    }

    try {
        const user = await userService.getOrCreateUser({ id: stringId });

        const jwtService = new JwtService(JWT_SECRET);

        const token = jwtService.sign({
            userId: user.telegramId 
        });

        const responseData = {
            telegramId: user.telegramId,
            token: token,
            isLinked: user.isLinked 
        };

        cache.setCache(stringId, responseData);
        
        return res.json({ success: true, ...responseData });

    } catch (err) {
        error("Auth handler error: " + err.message);
        return res.json({ success: false, message: "Internal Server Error" }, 500);
    }
}

module.exports = { authHandler };