import { verifyTelegram } from "./src/telegram-auth.js";

export default async ({ req, res, log, error }) => {
    const BOT_TOKEN = process.env.BOT_TOKEN;

    const { initData } = req.body;

    if (!initData) {
        return res.json({ success: false, message: "No initData provided." }, 400);
    }

    const result = verifyTelegram(initData, BOT_TOKEN);

    if (!result.isValid) {
        return res.json({ success: false, message: "Verification failed." }, 401);
    }

    return res.json({
        success: true,
        user: result.user
    });
};