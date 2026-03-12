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

    let body;

    try {
        body = typeof req.body === "string"
            ? JSON.parse(req.body)
            : req.body || {};

        if (body.data) {
            body = typeof body.data === "string"
                ? JSON.parse(body.data)
                : body.data;
        }

    } catch (e) {
        error("Parse body error: " + e.message);
        body = {};
    }

    const initData = body?.initData;

    if (!initData) {
        return res.json({ success: false }, 400);
    }

    const result = VerifyTelegram(initData, BOT_TOKEN);

    if (!result.isValid || !result.user) {
        return res.json({ success: false }, 401);
    }

    const telegramId = result.user.id.toString();

    const cached = loginCache.get(telegramId);

    if (cached && Date.now() < cached.expire) {
        log(`Cache hit ${telegramId}`);

        return res.json({
            success: true,
            user: cached.user,
            isNewUser: false
        });
    }

    try {

        const { user, isNewUser } = await dbService.getOrCreateUser(result.user);

        loginCache.set(telegramId, {
            user,
            expire: Date.now() + CACHE_TTL
        });

        log(`User ${telegramId} authenticated`);

        return res.json({
            success: true,
            user,
            isNewUser
        });

    } catch (err) {

        error("Database error: " + err.message);

        return res.json({ success: false }, 500);
    }
};