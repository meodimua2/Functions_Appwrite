const crypto = require("crypto");

class TelegramAuthService {
    constructor(botToken) {
        this.botToken = botToken;
        this.maxAge = 3600;
    }

    verify(initData) {
        if (!initData || !this.botToken) {
            return this._fail();
        }

        try {
            const params = new URLSearchParams(initData.trim());

            const hash = params.get("hash");
            if (!hash) return this._fail();

            params.delete("hash");

            const dataCheckString = [...params.entries()]
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([k, v]) => `${k}=${v}`)
                .join("\n");

            const secretKey = crypto
                .createHmac("sha256", "WebAppData")
                .update(this.botToken)
                .digest();

            const calculatedHash = crypto
                .createHmac("sha256", secretKey)
                .update(dataCheckString)
                .digest("hex");

            if (!this._safeEqual(hash, calculatedHash)) {
                return this._fail();
            }

            const authDate = Number(params.get("auth_date"));
            const now = Math.floor(Date.now() / 1000);

            if (!authDate || now - authDate > this.maxAge) {
                return this._fail();
            }

            const user = this._parseUser(params.get("user"));
            if (!user?.id) return this._fail();

            return {
                isValid: true,
                userId: String(user.id),
                user
            };

        } catch (err) {
            return this._fail();
        }
    }

    _parseUser(userStr) {
        try {
            return userStr ? JSON.parse(userStr) : null;
        } catch {
            return null;
        }
    }

    _safeEqual(a, b) {
        const bufA = Buffer.from(a, "hex");
        const bufB = Buffer.from(b, "hex");

        if (bufA.length !== bufB.length) return false;
        return crypto.timingSafeEqual(bufA, bufB);
    }

    _fail() {
        return { isValid: false, userId: null, user: null };
    }
}

module.exports = { TelegramAuthService };