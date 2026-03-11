import crypto from "crypto";

export const verifyTelegram = (initData, botToken) => {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    params.delete("hash");

    const dataCheckString = [...params.entries()]
        .sort()
        .map(([k, v]) => `${k}=${v}`)
        .join("\n");

    const secretKey = crypto.createHash("sha256").update(botToken).digest();
    const hmac = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

    return {
        isValid: hmac === hash,
        user: hmac === hash ? JSON.parse(params.get("user")) : null
    };
};