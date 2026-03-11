import { verifyTelegram } from "./src/telegram-auth.js";

export default async ({ req, res, log, error }) => {
    const BOT_TOKEN = process.env.BOT_TOKEN;

    // 1. BÓC VỎ LỚP 1: Đảm bảo req.body là Object
    let body = req.body;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (e) {
            body = {};
        }
    }

    // 2. BÓC VỎ LỚP 2: Lấy dữ liệu từ trường 'data' (Vì Frontend gửi JSON.stringify({initData}) vào đây)
    let payload = body;
    if (body.data) {
        try {
            // Nếu trường data là string, ta parse nó ra. Nếu là object thì dùng luôn.
            payload = typeof body.data === 'string' ? JSON.parse(body.data) : body.data;
        } catch (e) {
            error("Không thể bóc vỏ trường 'data': " + e.message);
        }
    }

    // 3. LẤY INITDATA THẬT SỰ
    const initData = payload?.initData;

    // Log để đạo hữu kiểm tra trong tab Executions
    log("Linh khí nhận được: " + (initData ? "Đầy đủ" : "Trống rỗng"));

    if (!initData) {
        return res.json({
            success: false,
            message: "No initData provided. Hãy kiểm tra lại cấu trúc gửi từ Frontend!",
            debug_received: body // Trả về để đạo hữu soi lỗi nếu cần
        }, 400);
    }

    // 4. XÁC THỰC LỆNH BÀI
    const result = verifyTelegram(initData, BOT_TOKEN);

    if (!result.isValid) {
        log("Thiên kiếp giáng lâm: Xác thực thất bại!");
        return res.json({ success: false, message: "Verification failed. Sai Bot Token hoặc dữ liệu bị sửa đổi." }, 401);
    }

    log(`Đạo hữu ${result.user?.username || result.user?.first_name} đã vượt qua trạm gác!`);

    return res.json({
        success: true,
        user: result.user
    });
};