const { TelegramAuthService } = require("../service/auth.service");
const { UserService } = require("../service/user.service");
const { CacheService } = require("../security/cache.service");
const { RateLimitService } = require("../security/rateLimit.service");
const jwt = require("jsonwebtoken");

const cache = new CacheService();
const rateLimitIP = new RateLimitService(500);
const rateLimitUser = new RateLimitService(1000);
const userService = new UserService();

async function authHandler({ req, res, log, error }) {
    const { BOT_TOKEN, JWT_SECRET } = process.env;
    
    const body = req.body; // ✅ dùng luôn

    const initData = body?.initData;

    if (!initData) {
        log("Handler Error - body: " + JSON.stringify(body));
        return res.json({ success: false, message: "Missing initData" }, 400);
    };
    
    const ip = req.headers["x-forwarded-for"] || "unknown";
    if (!rateLimitIP.check(ip)) return res.json({ success: false, message: "Too many requests (IP)" }, 429);

    const auth = new TelegramAuthService(BOT_TOKEN);
    const result = auth.verify(initData);

    log("Auth Verify Result: " + JSON.stringify(result));
    
    if (!result || !result.isValid) return res.json({ success: false, message: "Unauthorized" }, 401);

    const telegramId = String(result.userId);
    log("Processing Telegram ID: " + telegramId);
    if (!rateLimitUser.check(telegramId)) return res.json({ success: false, message: "Too many requests (User)" }, 429);

    const cached = cache.getCache(telegramId);
    if (cached) {
        log(`Cache hit for user: ${telegramId}`);
        return res.json({ success: true, ...cached });
    }

    try {
        const user = await userService.getOrCreateUser({ id: telegramId });
        
        let token = null;
        if (JWT_SECRET) {
            token = jwt.sign(
                { userId: user.userId, tgId: telegramId }, 
                JWT_SECRET, 
                { expiresIn: "7d" }
            );
        }

        const responseData = { userId: user.userId, token };
        cache.setCache(telegramId, responseData);

        log(`User ${telegramId} verified and saved`);
        return res.json({ success: true, ...responseData });

    } catch (err) {
        error(`Critical Error: ${err.message}`);
        throw err;
    }
}

module.exports = { authHandler };
