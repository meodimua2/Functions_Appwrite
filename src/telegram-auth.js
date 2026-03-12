const crypto = require("crypto");

function VerifyTelegram(initData, botToken) {

    if (!initData || !botToken) {
        return { isValid: false, user: null };
    }

    initData = initData.trim();

    const params = new URLSearchParams(initData);

    const hash = params.get("hash");
    if (!hash) {
        return { isValid: false, user: null };
    }

    params.delete("hash");

    const dataCheckString = Array.from(params.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");

    const secretKey = crypto
        .createHmac("sha256", "WebAppData")
        .update(botToken)
        .digest();

    const calculatedHash = crypto
        .createHmac("sha256", secretKey)
        .update(dataCheckString)
        .digest();

    const receivedHash = Buffer.from(hash, "hex");

    const isValid =
        receivedHash.length === calculatedHash.length &&
        crypto.timingSafeEqual(receivedHash, calculatedHash);

    if (!isValid) {
        return { isValid: false, user: null };
    }

    const authDate = parseInt(params.get("auth_date"), 10);
    const now = Math.floor(Date.now() / 1000);

    if (!authDate || now - authDate > 3600) {
        return { isValid: false, user: null };
    }

    let user = null;

    try {
        const userStr = params.get("user");
        if (userStr) user = JSON.parse(userStr);
    } catch {
        user = null;
    }

    if (!user?.id) {
        return { isValid: false, user: null };
    }

    return {
        isValid: true,
        user
    };
}

module.exports = { VerifyTelegram };