const { databases } = require("../config/appwrite.config");

class UserService {
    constructor() {
        this.dbId = "69b22e5d00106ba0308f";
        this.usersCol = "users";
    }

    async getOrCreateUser({ id }) {
        const stringId = String(id);

        try {
            const user = await databases.getDocument(
                this.dbId,
                this.usersCol,
                stringId
            );

            return this._formatUser(user);

        } catch (err) {
            if (err.code === 404) {
                const newUser = await databases.createDocument(
                    this.dbId,
                    this.usersCol,
                    stringId, 
                    {
                        telegramId: stringId, 
                        status: "online",
                        balanceTrx: 0,
                        addresstrx: null
                    }
                );

                return this._formatUser(newUser);
            }
            throw err;
        }
    }

    _formatUser(user) {
        return {
            userId: user.$id,
            telegramId: user.telegramId,
            status: user.status,
            balanceTrx: user.balance || 0,
            addressTrx: user.trx || null
        };
    }
}

module.exports = { UserService };
