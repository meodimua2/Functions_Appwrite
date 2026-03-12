import { verifyTelegram } from "./src/telegram-auth.js";

export default async ({ req, res, log, error }) => {
    const BOT_TOKEN = process.env.BOT_TOKEN;

    // DEBUG xem Appwrite gửi gì
    log("RAW BODY: " + JSON.stringify(req.body));

    let body = req.body;

    // Appwrite thường gửi body dạng string
    if (typeof body === "string") {
        try {
            body = JSON.parse(body);
        } catch {
            body = {};
        }
    }

    let initData = body?.initData;

    // Trường hợp Appwrite bọc trong data
    if (!initData && body?.data) {
        try {
            const inner =
                typeof body.data === "string"
                    ? JSON.parse(body.data)
                    : body.data;

            initData = inner?.initData;
        } catch (e) {
            error("Parse data lỗi: " + e.message);
        }
    }

    // decode vì Telegram encode
    if (initData) {
        initData = decodeURIComponent(initData);
    }

    log("InitData nhận được: " + (initData ? "Có dữ liệu" : "NULL"));

    if (!initData) {
        return res.json({
            success: false,
            message: "No initData provided",
            debug_received: body
        }, 400);
    }

    const result = verifyTelegram(initData, BOT_TOKEN);

    if (!result.isValid) {
        log("Verify Telegram FAILED");
        return res.json({
            success: false,
            message: "Verification failed"
        }, 401);
    }

    const userName =
        result.user?.username ||
        result.user?.first_name ||
        "Unknown user";

    log(`User verified: ${userName}`);

    return res.json({
        success: true,
        user: result.user
    });
};