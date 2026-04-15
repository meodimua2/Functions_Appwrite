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
    
    detectInputType(input) {
        if (input.includes("#")) return "riotId";
        if (input.length > 60) return "puuid";
        return "summonerId";
    }

    async searchPlayer(input) {
        const type = this.detectInputType(input);

        let profile;

        switch (type) {
            case "riotId":
                profile = await this.handleRiotId(input);
                break;

            case "puuid":
                profile = await this.handlePuuid(input);
                break;

            case "summonerId":
                profile = await this.handleSummonerId(input);
                break;

            default:
                throw new Error("Invalid input");
        }

        await this.saveMapping(profile);

        return profile;
    }

    async handleRiotId(input) {
        const [gameName, tagLine] = input.split("#");

        const account = await this.getAccountByRiotId(gameName, tagLine);
        if (!account) throw new Error("Account not found");

        const summoner = await this.getSummonerByPuuid(account.puuid);
        const league = await this.getLeagueInfo(summoner.id);

        return this.formatProfile({
            puuid: account.puuid,
            gameName: account.gameName,
            tagLine: account.tagLine,
            summonerId: summoner.id,
            profileIconId: summoner.profileIconId,
            league
        });
    }

    async handlePuuid(puuid) {
        const cached = await this.userService.findByPuuid(puuid);

        let summoner, league;

        if (cached) {
            summoner = { id: cached.summonerId, profileIconId: cached.profileIconId };
        } else {
            summoner = await this.getSummonerByPuuid(puuid);
        }

        league = await this.getLeagueInfo(summoner.id);

        return this.formatProfile({
            puuid,
            gameName: cached?.gameName || "Unknown",
            tagLine: cached?.tagLine || "",
            summonerId: summoner.id,
            profileIconId: summoner.profileIconId,
            league
        });
    }


    async handleSummonerId(summonerId) {
        const cached = await this.userService.findBySummonerId(summonerId);

        const league = await this.getLeagueInfo(summonerId);

        return this.formatProfile({
            puuid: cached?.puuid || null,
            gameName: cached?.gameName || "Unknown",
            tagLine: cached?.tagLine || "",
            summonerId,
            profileIconId: cached?.profileIconId || null,
            league
        });
    }

    async getAccountByRiotId(gameName, tagLine) {
        const url = `${this.accountBaseUrl}/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`;
        const res = await axios.get(url, { headers: this.headers });
        return res.data;
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
