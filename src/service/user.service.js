const { databases } = require("../config/appwrite.config");

class UserService {
    constructor() {
        this.dbId = process.env.APPWRITE_DATABASE_ID;
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
                        telegramId: stringId
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
            telegramId: user.telegramId
        };
    }
}

module.exports = { UserService };
