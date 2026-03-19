const { databases } = require("./appwrite");

class DatabaseService {
    constructor() {
        this.dbId = "69b22e5d00106ba0308f"; 
        this.collectionId = "users";
    }

    async getOrCreateUser(tgUser) {
        const telegramId = String(tgUser.id);

        try {
            // Thử lấy thông tin User
            const user = await databases.getDocument(
                this.dbId, 
                this.collectionId, 
                telegramId
            );
            
            return { 
                userId: user.$id, 
                status: user.status || "online" 
            };
        } catch (err) {
            // Nếu chưa có (404), tạo mới document với trạng thái mặc định
            if (err.code === 404) {
                const newUser = await databases.createDocument(
                    this.dbId,
                    this.collectionId,
                    telegramId, 
                    {
                        telegramId: telegramId, 
                        status: "online" // Chỉ lưu trạng thái
                    }
                );
                return { userId: newUser.$id, status: "online" };
            }
            throw err;
        }
    }
}

module.exports = { DatabaseService };
