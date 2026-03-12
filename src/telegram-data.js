const { databases } = require("./appwrite");

class DatabaseService {

    constructor() {
        this.dbId = process.env.APPWRITE_DATABASE_ID;
        this.collectionId = process.env.APPWRITE_COLLECTION_ID;
    }

    async getOrCreateUser(tgUser) {

        const telegramId = tgUser.id.toString();

        try {

            const user = await databases.getDocument(
                this.dbId,
                this.collectionId,
                telegramId
            );

            return user;

        } catch (err) {

            if (err.code === 404) {

                return await databases.createDocument(
                    this.dbId,
                    this.collectionId,
                    telegramId,
                    {
                        telegramId: telegramId,
                        username: tgUser.username || "",
                        firstName: tgUser.first_name || "",
                        lastName: tgUser.last_name || "",
                        photoUrl: tgUser.photo_url || "",
                        balance: 0,
                        exp: 0,
                        last_checkin: null
                    }
                );

            }

            console.error("DatabaseService error:", err.message);
            throw err;
        }
    }

}

module.exports = { DatabaseService };