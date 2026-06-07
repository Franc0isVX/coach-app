#!/usr/bin/env node
'use strict';

const NOTION_TOKEN   = process.env.NOTION_TOKEN;
const NOTION_DB_ID   = process.env.NOTION_DATABASE_ID;
const SUPABASE_URL   = process.env.SUPABASE_URL;
const SUPABASE_KEY   = process.env.SUPABASE_SERVICE_KEY;
const USER_EMAIL     = process.env.USER_EMAIL;

if (!NOTION_TOKEN || !NOTION_DB_ID || !SUPABASE_URL || !SUPABASE_KEY || !USER_EMAIL) {
  console.error('Missing required environment variables');
  process.exit(1);
}

async function fetchNotionPages() {
  const results = [];
  let cursor = undefined;

  do {
    const body = {
      page_size: 100,
      sorts: [{ property: 'Date prévue', direction: 'ascending' }],
    };
    if (cursor) body.start_cursor = cursor;

    const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Notion API error ${res.status}: ${txt}`);
    }

    const data = await res.json();
    results.push(...(data.results || []));
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);

  return results;
}

function parseStatus(name) {
  if (!name) return 'À faire';
  if (name.includes('✅')) return 'Fait';
  if (name.includes('❌')) return 'Sauté';
  if (name.includes('🔄')) return 'Modifié';
  return name;
}

function mapPage(page) {
  const p = page.properties;
  const date = p['Date prévue']?.date?.start;
  if (!date) return null;

  const session = {
    title:    p['Séance']?.title?.[0]?.plain_text || '—',
    type:     p['Type']?.select?.name            || 'Cardio',
    duree:    p['Durée (min)']?.number           || 0,
    statut:   parseStatus(p['Statut']?.select?.name),
    source:   p['Source']?.select?.name          || 'Notion',
    calories: p['Calories brûlées']?.number      || 0,
    notionId: page.id,
  };

  const difficulte = p['Difficulté prévue']?.select?.name;
  const detail     = p['Détail séance']?.rich_text?.[0]?.plain_text;
  const zoneCible  = p['Zone cible']?.multi_select?.map(z => z.name);
  const rpe        = p['RPE ressenti (1-10)']?.number;
  const charge     = p['Charge principale (kg)']?.number;
  const poidBarre  = p['Poid Barre']?.number;
  const poidDumbell= p['Poid Dumbell (1)']?.number;
  const poidWallball=p['Poid Wallball']?.select?.name;
  const theme      = p['Thème de la semaine']?.select?.name;
  const dureeReelle= p['Durée réelle (min)']?.number;
  const notesCoach = p['Notes coach']?.rich_text?.[0]?.plain_text;

  if (difficulte)          session.difficulte  = difficulte;
  if (detail)              session.detail      = detail;
  if (zoneCible?.length)   session.zoneCible   = zoneCible;
  if (rpe)                 session.rpe         = rpe;
  if (charge)              session.charge      = charge;
  if (poidBarre)           session.poidBarre   = poidBarre;
  if (poidDumbell)         session.poidDumbell = poidDumbell;
  if (poidWallball)        session.poidWallball= poidWallball;
  if (theme)               session.theme       = theme;
  if (dureeReelle)         session.dureeReelle = dureeReelle;
  if (notesCoach)          session.notesCoach  = notesCoach;

  return { date, session };
}

async function getUserId() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (!res.ok) throw new Error(`Supabase admin/users error ${res.status}`);
  const data = await res.json();
  const user = (data.users || []).find(u => u.email === USER_EMAIL);
  if (!user) throw new Error(`User ${USER_EMAIL} not found in Supabase`);
  return user.id;
}

async function syncToSupabase(userId, notionSessions) {
  // Fetch current data
  const getRes = await fetch(
    `${SUPABASE_URL}/rest/v1/user_data?id=eq.${userId}&select=sessions`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Accept': 'application/json',
      },
    }
  );

  if (!getRes.ok) throw new Error(`Supabase GET error ${getRes.status}`);
  const rows = await getRes.json();
  const current = rows[0]?.sessions || {};

  // Merge: Notion data overrides local for same dates
  const merged = { ...current, ...notionSessions };

  const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/user_data`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      id: userId,
      sessions: merged,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!upsertRes.ok) {
    const txt = await upsertRes.text();
    throw new Error(`Supabase upsert error ${upsertRes.status}: ${txt}`);
  }

  return Object.keys(notionSessions).length;
}

async function main() {
  console.log('🔄 Notion → Supabase sync starting...');

  const pages = await fetchNotionPages();
  console.log(`📋 ${pages.length} pages fetched from Notion`);

  const notionSessions = {};
  let skipped = 0;
  for (const page of pages) {
    const result = mapPage(page);
    if (result) {
      notionSessions[result.date] = result.session;
    } else {
      skipped++;
    }
  }
  console.log(`✅ ${Object.keys(notionSessions).length} sessions mapped (${skipped} skipped — no date)`);

  const userId = await getUserId();
  console.log(`👤 User: ${userId}`);

  const count = await syncToSupabase(userId, notionSessions);
  console.log(`☁️  ${count} Notion sessions merged into Supabase`);
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
