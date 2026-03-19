const { VerifyTelegram } = require("./src/telegram-auth");
const { DatabaseService } = require("./src/telegram-data");

const dbService = new DatabaseService();
const loginCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

module.exports = async ({ req, res, log, error }) => {
    const BOT_TOKEN = process.env.BOT_TOKEN;

    if (!BOT_TOKEN) {
        error("BOT_TOKEN missing");
        return res.json({ success: false }, 500);
    }

    // 1. Parse Body
    let body;
    try {
        body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
        if (body.data) {
            body = typeof body.data === "string" ? JSON.parse(body.data) : body.data;
        }
    } catch (e) {
        return res.json({ success: false }, 400);
    }

    const initData = body?.initData;
    if (!initData) return res.json({ success: false }, 400);

    // 2. Xác thực Telegram
    const result = VerifyTelegram(initData, BOT_TOKEN);

    // Kiểm tra isValid và userId từ kết quả trả về của hàm Verify
    if (!result.isValid || !result.userId) {
        return res.json({ success: false }, 401);
    }

    const telegramId = result.userId;

    // 3. Kiểm tra Cache (Nếu đã login gần đây thì trả về luôn)
    if (loginCache.has(telegramId)) {
        const cached = loginCache.get(telegramId);
        if (Date.now() < cached.expire) {
            log(`Cache hit: ${telegramId}`);
            return res.json({ success: true, userId: telegramId });
        }
    }

    // 4. Xử lý Database
    try {
        // Gọi hàm để đảm bảo Document tồn tại trong Appwrite
        const dbResult = await dbService.getOrCreateUser({ id: telegramId });

        // Lưu vào Cache
        loginCache.set(telegramId, {
            expire: Date.now() + CACHE_TTL
        });

        log(`User ${telegramId} verified`);

        return res.json({
            success: true,
            userId: dbResult.userId
        });

    } catch (err) {
        error("Database error: " + err.message);
        return res.json({ success: false }, 500);
    }
};
