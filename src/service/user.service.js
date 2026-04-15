const { databases } = require("../config/appwrite.config");
const { Query } = require("node-appwrite");

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
            if (err.code === 404 || err.type === "document_not_found") {
                try {
                    const newUser = await databases.createDocument(
                        this.dbId,
                        this.usersCol,
                        stringId,
                        {
                            puuid: null,
                            gameName: null,
                            tagLine: null,
                            tier: null,
                            rank: null,
                            leaguePoints: 0,
                            profileIconId: null
                        }
                    );
                    return this._formatUser(newUser);
                } catch (createErr) {
                    const user = await databases.getDocument(
                        this.dbId,
                        this.usersCol,
                        stringId
                    );
                    return this._formatUser(user);
                }
            }
            throw err;
        }
    }
    
    async updateTftInfo(telegramId, tftData = {}) {
        return await databases.updateDocument(
            this.dbId,
            this.usersCol,
            String(telegramId),
            {
                puuid: tftData.puuid ?? null,
                gameName: tftData.gameName ?? null,
                tagLine: tftData.tagLine ?? null,
                tier: tftData.tier ?? null,
                rank: tftData.rank ?? null,
                leaguePoints: tftData.leaguePoints ?? 0,
                profileIconId: tftData.profileIconId ?? null
            }
        );
    }

    _formatUser(user) {
        return {
            telegramId: user.$id,
            isLinked: !!user.puuid,
            puuid: user.puuid ?? null,
            gameName: user.gameName ?? 'N/A',
            rank: user.tier && user.rank 
                ? `${user.tier} ${user.rank}` 
                : 'Unranked'
        };
    }
}

module.exports = { UserService };
