// Mino Leaderboard API - Cloudflare Worker + KV

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

const MAX_ENTRIES = 50;

export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: CORS_HEADERS });
        }

        const url = new URL(request.url);
        const path = url.pathname;

        try {
            // POST /api/score - Submit stage score
            if (request.method === 'POST' && path === '/api/score') {
                const { stage, name, score, date } = await request.json();
                if (stage === undefined || !name || score === undefined) {
                    return json({ error: 'Missing fields' }, 400);
                }
                const key = 'stage_' + stage;
                const lb = JSON.parse(await env.LB.get(key) || '[]');
                lb.push({ name: name.slice(0, 10), score: Number(score), date: date || Date.now() });
                lb.sort((a, b) => b.score - a.score);
                await env.LB.put(key, JSON.stringify(lb.slice(0, MAX_ENTRIES)));
                return json({ ok: true });
            }

            // POST /api/total - Submit total score
            if (request.method === 'POST' && path === '/api/total') {
                const { name, totalScore, stageScores, date } = await request.json();
                if (!name || totalScore === undefined) {
                    return json({ error: 'Missing fields' }, 400);
                }
                const lb = JSON.parse(await env.LB.get('total') || '[]');
                lb.push({
                    name: name.slice(0, 10),
                    totalScore: Number(totalScore),
                    stageScores: (stageScores || []).map(Number),
                    date: date || Date.now()
                });
                lb.sort((a, b) => b.totalScore - a.totalScore);
                await env.LB.put('total', JSON.stringify(lb.slice(0, MAX_ENTRIES)));
                return json({ ok: true });
            }

            // GET /api/leaderboard/total
            if (request.method === 'GET' && path === '/api/leaderboard/total') {
                const lb = JSON.parse(await env.LB.get('total') || '[]');
                return json(lb);
            }

            // GET /api/leaderboard/:stage
            const stageMatch = path.match(/^\/api\/leaderboard\/(\d+)$/);
            if (request.method === 'GET' && stageMatch) {
                const key = 'stage_' + stageMatch[1];
                const lb = JSON.parse(await env.LB.get(key) || '[]');
                return json(lb);
            }

            return json({ error: 'Not found' }, 404);
        } catch (e) {
            return json({ error: e.message }, 500);
        }
    }
};

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
}
