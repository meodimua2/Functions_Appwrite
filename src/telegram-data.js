const { databases } = require("./appwrite");

class UserService {
    constructor() {
        this.dbId = "69b22e5d00106ba0308f";
        this.usersCol = "users";
    }

    async getOrCreateUser(tgUser) {
        const telegramId = String(tgUser.id);

        try {
            const user = await databases.getDocument(
                this.dbId,
                this.usersCol,
                telegramId
            );

            return {
                userId: user.$id,
                status: user.status || "online"
            };

        } catch (err) {
            if (err.code === 404) {
                const newUser = await databases.createDocument(
                    this.dbId,
                    this.usersCol,
                    telegramId,
                    {
                        telegramId,
                        status: "online"
                    }
                );

                return {
                    userId: newUser.$id,
                    status: "online"
                };
            }

            throw err;
        }
    }
}

module.exports = { UserService };
