const { authHandler, linkTftHandler } = require("./handlers/auth");

async function router(context) {
    const { payload, res } = context;
    const action = payload?.action || 'auth';
  
    switch (action) {
        case 'auth':
            return await authHandler(context);
        case 'link_tft':
            return await linkTftHandler(context);
        default:
            return res.json({
                success: false,
                message: `Action '${action}' không tồn tại`
            }, 404);
    }
}

module.exports = router;
