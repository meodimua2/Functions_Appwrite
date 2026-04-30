const { TelegramAuthService } = require("../service/auth.service");
const { UserService } = require("../service/user.service");
const { CacheService } = require("../security/cache.service");
const { RateLimitService } = require("../security/rateLimit.service");
const { JwtService } = require("../security/jwt.service");

const cache = new CacheService();
const rateLimitIP = new RateLimitService(500);
const rateLimitUser = new RateLimitService(1000);
const userSvc = new UserService();

async function authHandler({ payload, req, res, log, error }) {
    const { BOT_TOKEN, JWT_SECRET } = process.env;

    const initData = payload?.initData;
    if (!initData) {
        return res.json({ success: false, message: "Thiếu initData" }, 400);
    }

    const ip = req.headers["x-forwarded-for"] || "unknown";
    if (!rateLimitIP.check(ip)) {
        return res.json({ success: false, message: "Quá nhiều yêu cầu, thử lại sau" }, 429);
    }

    const auth = new TelegramAuthService(BOT_TOKEN);
    const result = auth.verify(initData);

    if (!result?.isValid) {
        return res.json({ success: false, message: "Xác thực thất bại" }, 401);
    }

    const userId = String(result.userId);

    if (!rateLimitUser.check(userId)) {
        return res.json({ success: false, message: "Quá nhiều yêu cầu, thử lại sau" }, 429);
    }

    const cached = cache.getCache(userId);
    if (cached) return res.json({ success: true, ...cached });

    try {
        const user = await userSvc.getOrCreate(userId);

        const jwtService = new JwtService(JWT_SECRET);
        const token = jwtService.sign({ userId, kycStatus: user.kycStatus });

        const responseData = {
            userId,
            token,
            kycStatus: user.kycStatus,
            creditScore: user.creditScore,
            activeLoansCount: user.activeLoansCount,
        };

        cache.setCache(userId, responseData);
        log(`Auth success: user ${userId}`);

        return res.json({ success: true, ...responseData });
    } catch (err) {
        error("Auth error: " + err.message);
        return res.json({ success: false, message: "Lỗi server" }, 500);
    }
}

module.exports = { authHandler };
