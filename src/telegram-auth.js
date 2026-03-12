import crypto from "crypto";

export const verifyTelegram = (initData, botToken) => {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    params.delete("hash");

    const dataCheckString = [...params.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join("\n");

    const secretKey = crypto.createHmac("sha256", "WebAppData")
        .update(botToken)
        .digest();

    const hmac = crypto.createHmac("sha256", secretKey)
        .update(dataCheckString)
        .digest("hex");

    const isValid = hmac === hash;
    return {
        isValid,
        user: isValid ? JSON.parse(params.get("user")) : null
    };
};