// Leaderboard Service - local + remote (Cloudflare Worker)

const LeaderboardService = {
    API_URL: 'https://lb.taekm33.org',

    // Submit stage score
    async submitScore(stage, name, score, look) {
        this._saveLocal(stage, name, score, look);
        try {
            const res = await fetch(this.API_URL + '/api/score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stage, name, score, date: Date.now(), look: look || null })
            });
            if (res.ok) return true;
        } catch (e) { /* offline fallback */ }
        return false;
    },

    // Submit total score after all 10 stages
    async submitTotalScore(name, totalScore, stageScores, look) {
        this._saveTotalLocal(name, totalScore, stageScores, look);
        try {
            await fetch(this.API_URL + '/api/total', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, totalScore, stageScores, date: Date.now(), look: look || null })
            });
        } catch (e) { /* offline fallback */ }
    },

    // Fetch stage leaderboard (remote first, local fallback)
    async getStageLeaderboard(stage) {
        try {
            const res = await fetch(this.API_URL + '/api/leaderboard/' + stage);
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) return data;
            }
        } catch (e) { /* fallback */ }
        return this._getLocal(stage);
    },

    // Fetch total leaderboard
    async getTotalLeaderboard() {
        try {
            const res = await fetch(this.API_URL + '/api/leaderboard/total');
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) return data;
            }
        } catch (e) { /* fallback */ }
        return this._getTotalLocal();
    },

    // --- Local Storage ---
    _saveLocal(stage, name, score, look) {
        try {
            const key = 'pixelCrossing_lb_' + stage;
            const lb = JSON.parse(localStorage.getItem(key) || '[]');
            lb.push({ name, score, date: Date.now(), look: look || null });
            lb.sort((a, b) => b.score - a.score);
            localStorage.setItem(key, JSON.stringify(lb.slice(0, 30)));
        } catch (e) {}
    },

    _getLocal(stage) {
        try { return JSON.parse(localStorage.getItem('pixelCrossing_lb_' + stage) || '[]'); }
        catch (e) { return []; }
    },

    _saveTotalLocal(name, totalScore, stageScores, look) {
        try {
            const lb = JSON.parse(localStorage.getItem('pixelCrossing_lb_total') || '[]');
            lb.push({ name, totalScore, stageScores, date: Date.now(), look: look || null });
            lb.sort((a, b) => b.totalScore - a.totalScore);
            localStorage.setItem('pixelCrossing_lb_total', JSON.stringify(lb.slice(0, 30)));
        } catch (e) {}
    },

    _getTotalLocal() {
        try { return JSON.parse(localStorage.getItem('pixelCrossing_lb_total') || '[]'); }
        catch (e) { return []; }
    }
};
