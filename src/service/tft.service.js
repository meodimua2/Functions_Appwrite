const axios = require("axios");

class TftService {
    constructor() {
        this.apiKey = process.env.RIOT_API_KEY;

        this.accountRegion = "asia"; 
        this.platformRegion = "vn2"; 
        this.accountBaseUrl = `https://${this.accountRegion}.api.riotgames.com`;
        this.platformBaseUrl = `https://${this.platformRegion}.api.riotgames.com`;

        this.headers = {
            "X-Riot-Token": this.apiKey
        };
    }

    async getAccountByRiotId(gameName, tagLine) {
        if (!gameName || !tagLine) {
            throw new Error("Missing Riot ID");
        }

        try {
            const url = `${this.accountBaseUrl}/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`;

            const res = await axios.get(url, { headers: this.headers });
            return res.data;

        } catch (err) {
            if (err.response?.status === 404) return null;
            throw err;
        }
    }

    async getSummonerByPuuid(puuid) {
        try {
            const url = `${this.platformBaseUrl}/tft/summoner/v1/summoners/by-puuid/${puuid}`;

            const res = await axios.get(url, { headers: this.headers });
            return res.data;

        } catch (err) {
            if (err.response?.status === 404) return null;
            throw err;
        }
    }

    async getLeagueInfo(summonerId) {
        try {
            const url = `${this.platformBaseUrl}/tft/league/v1/entries/by-summoner/${summonerId}`;

            const res = await axios.get(url, { headers: this.headers });

            // TFT chỉ cần lấy RANKED_TFT
            const ranked = res.data.find(q => q.queueType === "RANKED_TFT");

            return ranked || null;

        } catch (err) {
            if (err.response?.status === 404) return null;
            throw err;
        }
    }

    async getFullTftProfile(gameName, tagLine) {
        const account = await this.getAccountByRiotId(gameName, tagLine);
        if (!account) throw new Error("Account not found");

        const summoner = await this.getSummonerByPuuid(account.puuid);
        if (!summoner) throw new Error("Summoner not found");

        const league = await this.getLeagueInfo(summoner.id);

        return {
            puuid: account.puuid,
            gameName: account.gameName,
            tagLine: account.tagLine,
            profileIconId: summoner.profileIconId,

            tier: league?.tier || null,
            rank: league?.rank || null,
            leaguePoints: league?.leaguePoints || 0
        };
    }
}

module.exports = { TftService };
