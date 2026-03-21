const jwt = require("jsonwebtoken");

class JwtService {
    constructor(secret) {
        this.secret = secret;
    }

    sign(payload, options = { expiresIn: "1d" }) {
        if (!this.secret) return null;
        return jwt.sign(payload, this.secret, options);
    }

    verify(token) {
        try {
            return jwt.verify(token, this.secret);
        } catch {
            return null;
        }
    }
}

module.exports = { JwtService };