const axios = require("axios");

class TftService {
    constructor(userService) {
        this.apiKey = process.env.RIOT_API_KEY;

        this.accountRegion = "asia";
        this.platformRegion = "vn2";

        this.accountBaseUrl = `https://${this.accountRegion}.api.riotgames.com`;
        this.platformBaseUrl = `https://${this.platformRegion}.api.riotgames.com`;

        this.headers = {
            "X-Riot-Token": this.apiKey
        };

        this.userService = userService;
    }

    async searchPlayer(riotId) {
        if (!riotId.includes("#")) {
            throw new Error("Riot ID phải có dạng name#tag");
        }

        const [gameName, tagLine] = riotId.split("#");

        const account = await this.getAccountByRiotId(gameName, tagLine);

        const summoner = await this.getSummonerByPuuid(account.puuid);

        const league = await this.getLeagueInfo(summoner.id);

        const profile = this.formatProfile({
            puuid: account.puuid,
            gameName: account.gameName,
            tagLine: account.tagLine,
            summonerId: summoner.id,
            profileIconId: summoner.profileIconId,
            league
        });


        return profile;
    }

    async getAccountByRiotId(gameName, tagLine) {
        try {
            const url = `${this.accountBaseUrl}/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`;
            const res = await axios.get(url, { headers: this.headers });
            return res.data;
        } catch (err) {
            if (err.response?.status === 404) {
                throw new Error("Không tìm thấy Riot ID");
            }
            throw err;
        }
    }

    async getSummonerByPuuid(puuid) {
        const url = `${this.platformBaseUrl}/tft/summoner/v1/summoners/by-puuid/${puuid}`;
        const res = await axios.get(url, { headers: this.headers });
        return res.data;
    }

    async getLeagueInfo(summonerId) {
        const url = `${this.platformBaseUrl}/tft/league/v1/entries/by-summoner/${summonerId}`;
        const res = await axios.get(url, { headers: this.headers });

        return res.data.find(q => q.queueType === "RANKED_TFT") || null;
    }

    formatProfile({ puuid, gameName, tagLine, summonerId, profileIconId, league }) {
        return {
            puuid,
            summonerId,
            gameName,
            tagLine,
            profileIconId,
            tier: league?.tier || null,
            rank: league?.rank || null,
            leaguePoints: league?.leaguePoints || 0
        };
    }

    async saveMapping(profile) {
        if (!profile.puuid || !profile.summonerId) return;

        await this.userService.saveRiotMapping({
            puuid: profile.puuid,
            summonerId: profile.summonerId,
            gameName: profile.gameName,
            tagLine: profile.tagLine,
            profileIconId: profile.profileIconId
        });
    }
}

module.exports = { TftService };