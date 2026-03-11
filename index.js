import { verifyTelegram } from "./src/telegram-auth.js";

export default async ({ req, res, log, error }) => {
    const BOT_TOKEN = process.env.BOT_TOKEN;

    // 1. XỬ LÝ LỚP VỎ 1: Đảm bảo body là Object (Hóa giải việc Appwrite gửi String)
    let body = req.body;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (e) {
            body = {};
        }
    }

    // 2. XỬ LÝ LỚP VỎ 2 & LẤY DỮ LIỆU: Dò tìm initData ở mọi ngóc ngách
    // Cách này sẽ lấy initData dù đạo hữu gửi thẳng hay gửi qua trường 'data'
    let initData = body.initData;

    if (!initData && body.data) {
        try {
            const innerData = typeof body.data === 'string' ? JSON.parse(body.data) : body.data;
            initData = innerData?.initData;
        } catch (e) {
            error("Không thể bóc vỏ lớp data: " + e.message);
        }
    }

    // 3. KIỂM TRA LINH KHÍ
    log("Linh khí nhận được: " + (initData ? "Đầy đủ" : "Trống rỗng"));

    if (!initData) {
        return res.json({
            success: false,
            message: "No initData provided. Hãy kiểm tra cấu trúc gửi từ Frontend!",
            debug_received: body // Trả về để đạo hữu soi lỗi ở tab Network
        }, 400);
    }

    // 4. XÁC THỰC LỆNH BÀI (Verify HMAC)
    const result = verifyTelegram(initData, BOT_TOKEN);

    if (!result.isValid) {
        log("Thiên kiếp giáng lâm: Xác thực thất bại!");
        return res.json({
            success: false,
            message: "Verification failed. Kiểm tra BOT_TOKEN trong Appwrite Settings!"
        }, 401);
    }

    // 5. THÀNH CÔNG
    const userName = result.user?.username || result.user?.first_name || "Vô danh đạo hữu";
    log(`Đạo hữu ${userName} đã vượt qua trạm gác!`);

    return res.json({
        success: true,
        user: result.user
    });
};