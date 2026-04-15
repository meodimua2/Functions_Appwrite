const { TftService } = require("../service/tft.service");
const { UserService } = require("../service/user.service");
const { JwtService } = require("../security/jwt.service");

const userService = new UserService();
const tftService = new TftService(userService);

async function linkTftHandler(context) {
    const { payload, res, error } = context;
    const { input, token } = payload;

    try {
        // 🔐 validate input
        if (!input || typeof input !== "string") {
            return res.json({
                success: false,
                message: "Thiếu input"
            }, 400);
        }

        if (!token) {
            return res.json({
                success: false,
                message: "Thiếu token"
            }, 401);
        }

        // 🔐 verify JWT
        const jwt = new JwtService(process.env.JWT_SECRET);
        const decoded = jwt.verify(token);

        if (!decoded || !decoded.userId) {
            return res.json({
                success: false,
                message: "Token không hợp lệ hoặc đã hết hạn"
            }, 401);
        }

        const userId = String(decoded.userId);

        // 📦 đảm bảo user tồn tại
        await userService.getOrCreateUser({ id: userId });

        // 🔥 gọi unified search (điểm mạnh của bạn)
        const tftProfile = await tftService.searchPlayer(input);

        if (!tftProfile) {
            return res.json({
                success: false,
                message: "Không tìm thấy người chơi"
            }, 404);
        }

        // 💾 update DB
        await userService.updateTftInfo(userId, tftProfile);

        return res.json({
            success: true,
            message: "Liên kết tài khoản thành công",
            data: tftProfile
        });

    } catch (err) {
        error("Link TFT error: " + err.message);

        return res.json({
            success: false,
            message: err.message || "Lỗi hệ thống"
        }, 400);
    }
}