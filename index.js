import { verifyTelegram } from "./src/telegram-auth.js"; // Nhớ đuôi .js nhé

export default async ({ req, res, log, error }) => {
    const BOT_TOKEN = process.env.BOT_TOKEN;

    // Đảm bảo lấy được dữ liệu kể cả khi req.body là chuỗi
    let data = req.body;
    if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) { data = {}; }
    }

    const initData = data?.initData;

    if (!initData) {
        return res.json({ success: false, message: "No initData provided." }, 400);
    }

    const result = verifyTelegram(initData, BOT_TOKEN);

    if (!result.isValid) {
        log("Xác thực thất bại!"); // Log này sẽ hiện trong tab Executions
        return res.json({ success: false, message: "Verification failed." }, 401);
    }

    log(`Đạo hữu ${result.user?.username} đã vượt qua trạm gác!`);
    return res.json({
        success: true,
        user: result.user
    });
};