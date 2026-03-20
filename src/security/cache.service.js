const crypto = require("crypto");

class CacheService {
    constructor(ttl = 5 * 60 * 1000) {
        this.cache = new Map();
        this.ttl = ttl;
    }

    _hash(key) {
        return crypto.createHash("sha256").update(key).digest("hex");
    }

    getCache(key) {
        const hashed = this._hash(key);
        const data = this.cache.get(hashed);

        if (!data) return null;

        if (Date.now() > data.expire) {
            this.cache.delete(hashed);
            return null;
        }

        return data.value;
    }

    setCache(key, value) {
        const hashed = this._hash(key);

        this.cache.set(hashed, {
            value,
            expire: Date.now() + this.ttl
        });
    }
}

module.exports = { CacheService };