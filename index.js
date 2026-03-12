import { verifyTelegram } from "./src/telegram-auth.js";
import { databaseService } from "./src/telegram-data.js";

const dbService = new databaseService();

export default async ({ req, res, log, error }) => {

    const BOT_TOKEN = process.env.BOT_TOKEN;

    let body = req.body;

    try {
        if (typeof body === "string") body = JSON.parse(body);

        if (body?.data) {
            body = typeof body.data === "string"
                ? JSON.parse(body.data)
                : body.data;
        }

    } catch (e) {
        error("Parse body error: " + e.message);
        body = {};
    }

    const initData = body?.initData || null;

    if (!initData) {
        return res.json(
            { success: false, message: "Missing initData" },
            400
        );
    }

    const result = verifyTelegram(initData, BOT_TOKEN);

    if (!result.isValid || !result.user) {
        return res.json(
            { success: false, message: "Telegram verification failed" },
            401
        );
    }

    try {

        const userDoc = await dbService.getOrCreateUser(result.user);

        log(`User ${userDoc.firstName} authenticated`);

        return res.json({
            success: true,
            user: userDoc
        });

    } catch (err) {

        error("Database error: " + err.message);

        return res.json(
            { success: false, message: "Database error" },
            500
        );
    }
};