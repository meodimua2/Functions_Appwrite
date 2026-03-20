class RateLimitService {
    constructor(limitMs = 1000) {
        this.map = new Map();
        this.limitMs = limitMs;
    }

    check(key) {
        const now = Date.now();
        const last = this.map.get(key) || 0;

        if (now - last < this.limitMs) {
            return false;
        }

        this.map.set(key, now);
        return true;
    }
}

module.exports = { RateLimitService };