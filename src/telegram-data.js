const { databases } = require("./appwrite");

class DatabaseService {
    constructor() {
        this.dbId = "69b22e5d00106ba0308f"; 
        this.collectionId = "users";
    }

    async getOrCreateUser(tgUser) {
    const telegramId = String(tgUser.id);

    try {
        const user = await databases.getDocument(this.dbId, this.collectionId, telegramId);
        return { userId: user.$id, friends: user.friends, status: user.status };
    } catch (err) {
        if (err.code === 404) {
            const newUser = await databases.createDocument(
                this.dbId,
                this.collectionId,
                telegramId, 
                {
                    telegramId: telegramId, 
                    status: "online",      
                    friends: []            
                }
            );
            return { userId: newUser.$id, friends: [], status: "active" };
        }
        throw err;}
    }

module.exports = { DatabaseService };
