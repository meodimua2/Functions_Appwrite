const { TftService } = require("../service/tft.service");
const { UserService } = require("../service/user.service");
const { JwtService } = require("../security/jwt.service");

const userService = new UserService();
const tftService = new TftService(userService);

async function linkTftHandler(context) {
    const { payload, res, log, error } = context;
    const { input, token } = payload;
    const { JWT_SECRET } = process.env; // Đồng nhất cách lấy biến môi trường

    try {
        // 1. Xác thực JWT
        const jwt = new JwtService(JWT_SECRET);
        const decoded = jwt.verify(token);

        if (!decoded || !decoded.userId) {
            return res.json({ success: false, message: "Token không hợp lệ" }, 401);
        }

        // stringId chính là Telegram ID (userId trong token)
        const stringId = String(decoded.userId);

        // 2. Lấy dữ liệu mới từ Riot API
        const tftProfile = await tftService.searchPlayer(input);

        // 3. Cập nhật vào Appwrite
        // Không cần saveMapping trong service, handler sẽ điều phối lưu trữ ở đây
        const updatedUserDoc = await userService.updateTftInfo(stringId, tftProfile);

        // 4. Trả về dữ liệu đã được định dạng đồng nhất
        return res.json({
            success: true,
            message: "Liên kết thành công",
            data: userService._formatUser(updatedUserDoc) // Đảm bảo có isLinked và định dạng chuẩn
        });

    } catch (err) {
        error("Link TFT error: " + err.message);
        return res.json({
            success: false,
            message: err.message || "Lỗi hệ thống"
        }, 400);
    }
}

module.exports = { linkTftHandler };