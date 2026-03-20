const { authHandler } = require("./handlers/auth"); 

module.exports = async (context) => {
    const { req, res, error, log } = context;

    // --- ĐOẠN GHI LOG DEBUG ---
    log("--- DEBUG REQUEST ---");
    log("Type of req.body: " + typeof req.body);
    log("Content of req.body: " + JSON.stringify(req.body));
    log("Headers: " + JSON.stringify(req.headers));
    log("---------------------");

    let payload = req.body;

    try {
        // Bước 1: Parse nếu là chuỗi
        if (typeof payload === "string") {
            log("Payload is string, parsing...");
            payload = JSON.parse(payload);
        }

        // Bước 2: Bóc lớp vỏ 'body' (Nếu có)
        if (payload && payload.body) {
            log("Found nested 'body' field, unboxing...");
            payload = typeof payload.body === "string" ? JSON.parse(payload.body) : payload.body;
        }

        // Bước 3: Bóc thêm lớp 'data' (Nếu có)
        if (payload && payload.data) {
            log("Found nested 'data' field, unboxing...");
            payload = typeof payload.data === "string" ? JSON.parse(payload.data) : payload.data;
        }
        
        log("Final Payload: " + JSON.stringify(payload));
        
    } catch (e) {
        error("JSON Parse Error: " + e.message);
        return res.json({ success: false, message: "Invalid JSON structure" }, 400);
    }

    // Gán kết quả sạch vào req.body
    context.req.body = payload;

    try {
        return await authHandler(context);
    } catch (err) {
        error("Main Index Error: " + err.message);
        return res.json({ success: false, message: "Internal Server Error" }, 500);
    }
};
