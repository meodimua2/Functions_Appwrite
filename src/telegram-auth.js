const crypto = require("crypto");

const VerifyTelegram = (initData, botToken) => {
    const params = new URLSearchParams(initData);

    const hash = params.get("hash");
    if (!hash) {
        return { isValid: false, user: null };
    }

    params.delete("hash");

    const dataCheckString = [...params.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
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

    let user = null;

    if (isValid && params.get("user")) {
        try {
            user = JSON.parse(params.get("user"));
        } catch {
            user = null;
        }
    }

    return { isValid, user };
};

module.exports = { VerifyTelegram };