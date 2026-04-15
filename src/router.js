const { authHandler } = require("./handlers/auth");
const { linkTftHandler } = require("./handlers/tft");
const { authMiddleware } = require("./middleware/auth.middleware");

async function router(context) {
    const { payload, res } = context;
    const action = payload?.action || 'auth';
  
    switch (action) {
        case 'auth':
            return await authHandler(context);
        case 'link_tft':
            // Áp dụng middleware auth
            const authResult = await authMiddleware(context);
            if (authResult) return authResult; // Nếu có lỗi, trả về
            return await linkTftHandler(context);
        default:
            return res.json({
                success: false,
                message: `Action '${action}' không tồn tại`
            }, 404);
    }
}

module.exports = router;
