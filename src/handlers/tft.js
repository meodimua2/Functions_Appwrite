const { TftService } = require("../service/tft.service");
const { UserService } = require("../service/user.service");
const { JwtService } = require("../security/jwt.service");

const userService = new UserService();
const tftService = new TftService(userService);

async function linkTftHandler(context) {
    const { payload, res, log, error, userId } = context;
    const { input } = payload;

    if (!input || typeof input !== 'string' || !input.includes('#')) {
        return res.json({ success: false, message: "Input không hợp lệ, phải là Riot ID dạng name#tag" }, 400);
    }

    const startTime = Date.now();

    try {
        const tftProfile = await tftService.searchPlayer(input);

        const updatedUserDoc = await userService.updateTftInfo(userId, tftProfile);

        const duration = Date.now() - startTime;
        log(`Link TFT completed in ${duration}ms for user ${userId}`);

        return res.json({
            success: true,
            message: "Liên kết thành công",
            data: userService._formatUser(updatedUserDoc) 
        });

    } catch (err) {
        const duration = Date.now() - startTime;
        error(`Link TFT failed in ${duration}ms: ${err.message}`);
        return res.json({
            success: false,
            message: err.message || "Lỗi hệ thống"
        }, 400);
    }
}

module.exports = { linkTftHandler };