const { TftService } = require("../service/tft.service");
const { UserService } = require("../service/user.service");
const { JwtService } = require("../security/jwt.service");

const userService = new UserService();
const tftService = new TftService(userService);

async function linkTftHandler(context) {
    const { payload, res } = context;
    const { input, token } = payload;

    try {
        // 🔐 validate input
        if (!input || typeof input !== "string" || !input.includes("#")) {
            return res.json({
                success: false,
                message: "Riot ID phải có dạng name#tag"
            }, 400);
        }

        // 🔐 verify JWT
        const jwt = new JwtService(process.env.JWT_SECRET);
        const decoded = jwt.verify(token);

        if (!decoded || !decoded.userId) {
            return res.json({ success: false, message: "Token không hợp lệ" }, 401);
        }

        const userId = String(decoded.userId);

        const tftProfile = await tftService.searchPlayer(input);

        await userService.getOrCreateUser({ id: userId });
        await userService.updateTftInfo(userId, tftProfile);

        return res.json({
            success: true,
            message: "Liên kết thành công",
            data: tftProfile
        });

    } catch (err) {
        return res.json({
            success: false,
            message: err.message || "Lỗi hệ thống"
        }, 400);
    }
}

module.exports = { linkTftHandler };