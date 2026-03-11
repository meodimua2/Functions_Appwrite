import crypto from "crypto";

export default async ({ req, res }) => {

    const BOT_TOKEN = process.env.BOT_TOKEN;

    const { initData } = JSON.parse(req.body);

    const params = new URLSearchParams(initData);
    const hash = params.get("hash");

    params.delete("hash");

    const dataCheckString = [...params.entries()]
        .sort()
        .map(([k, v]) => `${k}=${v}`)
        .join("\n");

    const secretKey = crypto
        .createHash("sha256")
        .update(BOT_TOKEN)
        .digest();

    const hmac = crypto
        .createHmac("sha256", secretKey)
        .update(dataCheckString)
        .digest("hex");

    if (hmac !== hash) {
        return res.json({ success: false });
    }

    const user = JSON.parse(params.get("user"));

    return res.json({
        success: true,
        user
    });
};