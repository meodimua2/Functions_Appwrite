const { databases } = require("./appwrite");

class DatabaseService {

    constructor() {
        this.dbId = "69b22e5d00106ba0308f";
        this.collectionId = "daohuulo";
    }

    sanitizeTelegramUser(tgUser) {
        return {
            telegramId: tgUser.id.toString(),
            username: String(tgUser.username || "").slice(0, 64),
            firstName: String(tgUser.first_name || "").slice(0, 64),
            lastName: String(tgUser.last_name || "").slice(0, 64),
            photoUrl: String(tgUser.photo_url || "")
        };
    }

    sanitizeResponse(user) {
        return {
            telegramId: user.telegramId,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            photoUrl: user.photoUrl,

            balance: user.balance,
            exp: user.exp,

            streak: user.streak,
            last_checkin: user.last_checkin,

            onboarded: user.onboarded
        };
    }

    async getOrCreateUser(tgUser) {

        const safeUser = this.sanitizeTelegramUser(tgUser);
        const telegramId = safeUser.telegramId;

        try {

            const user = await databases.getDocument({
                databaseId: this.dbId,
                collectionId: this.collectionId,
                documentId: telegramId
            });

            return {
                user: this.sanitizeResponse(user),
                isNewUser: false
            };

        } catch (err) {

            if (err.code === 404) {

                const newUser = await databases.createDocument({
                    databaseId: this.dbId,
                    collectionId: this.collectionId,
                    documentId: telegramId,
                    data: {
                        ...safeUser,

                        balance: 0,
                        exp: 0,

                        streak: 0,
                        last_checkin: null,

                        onboarded: false,

                        createdAt: new Date().toISOString()
                    }
                });

                return {
                    user: this.sanitizeResponse(newUser),
                    isNewUser: true
                };
            }

            console.error("DatabaseService error:", err.message);
            throw err;
        }
    }
}

module.exports = { DatabaseService };
