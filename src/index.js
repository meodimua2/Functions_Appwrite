const { authHandler } = require("./src/handlers/auth"); 

module.exports = async (context) => {
    const { req, res, log, error } = context;

    log("--- START DEBUG ---");
    log("1. Raw req.body type: " + typeof req.body);
    log("2. Raw req.body content: " + JSON.stringify(req.body));

    let payload = req.body;

    try {
        // Bước 1: Parse nếu là chuỗi
        if (typeof payload === "string") {
            payload = JSON.parse(payload);
            log("3. After JSON.parse: " + JSON.stringify(payload));
        }

        // Bước 2: Xử lý trường hợp bọc trong 'body' (Như ảnh Telegram của bạn)
        if (payload && payload.body) {
            log("4. Found nested 'body', unboxing...");
            let innerBody = payload.body;
            if (typeof innerBody === "string") {
                innerBody = JSON.parse(innerBody);
            }
            payload = innerBody;
        }

        // Bước 3: Xử lý trường hợp bọc trong 'data'
        if (payload && payload.data) {
            log("5. Found nested 'data', unboxing...");
            let innerData = payload.data;
            if (typeof innerData === "string") {
                innerData = JSON.parse(innerData);
            }
            payload = innerData;
        }

        log("6. Final Payload to Handler: " + JSON.stringify(payload));
        
        // Gán ngược lại vào req.body cho handler
        context.req.body = payload;

        return await authHandler(context);

    } catch (e) {
        error("7. Parse Error Detail: " + e.message);
        return res.json({ 
            success: false, 
            message: "Parse Error: " + e.message,
            debug_received: req.body // Gửi ngược lại cái nó nhận được để bạn xem
        }, 400);
    }
};
