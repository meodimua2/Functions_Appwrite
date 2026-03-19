const { databases } = require("./appwrite");

class DatabaseService {
    constructor() {
        this.dbId = "69b22e5d00106ba0308f"; 
        this.collectionId = "users";
    }

    async getOrCreateUser(tgUser) {
        const telegramId = String(tgUser.id);

        try {
            // Kiểm tra ID đã có chưa
            const user = await databases.getDocument(
                this.dbId,
                this.collectionId,
                telegramId
            );

            return { userId: user.$id };

        } catch (err) {
            if (err.code === 404) {
                // Tạo mới Document trống nếu chưa có
                const newUser = await databases.createDocument(
                    this.dbId,
                    this.collectionId,
                    telegramId,
                    {} // Data rỗng
                );

                return { userId: newUser.$id };
            }
            throw err;
        }
    }
}

module.exports = { DatabaseService };
