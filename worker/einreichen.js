// Cloudflare Worker für die Toolbox.
//
//   POST /             Einreichung aus der Eingabemaske → GitHub-Issue mit Label "eingereicht"
//   POST /moderation   Moderation: offene Einreichungen auflisten, freigeben oder ablehnen
//
// Freigeben setzt das Label "freigegeben". Danach übernimmt der GitHub-Workflow
// "Tool aufnehmen" den Eintrag automatisch in die Toolbox.
//
// Einstellungen im Worker (Settings → Variables and Secrets):
//   GITHUB_TOKEN    (Secret)  Fine-grained Token, nur für dieses Repository, Recht "Issues: Read and write"
//   REPO            (Text)    z. B. Goshuer/KI-Katalog
//   ALLOWED_ORIGIN  (Text)    z. B. https://goshuer.github.io   (mehrere mit Komma trennen)
//   KURS_CODE       (Secret)  optional: Code, den man zum Einreichen kennen muss
//   MOD_CODE        (Secret)  Passwort für die Moderation
//   AUTO_FREIGABE   (Text)    optional: "nein" = Einreichungen warten auf Freigabe in der Moderation.
//                             Ohne diese Variable werden Einreichungen mit gültigem Kurs-Code sofort veröffentlicht.

const KATEGORIEN = ['KI & Recherche', 'Design & Bild', 'Text & Dokumente', 'Audio & Video', 'Barrierefreiheit', 'Produktivität', 'Dateien'];

// Beschriftungen müssen zu scripts/issue-to-eintrag.mjs passen.
const FELDER = {
  skill: [
    ['name', 'Name', 120, true],
    ['plattform', 'Plattform', 60, true],
    ['kategorie', 'Kategorie', 60, true],
    ['beschreibung', 'Das Tool ist für …', 200, true],
    ['funktion', 'Es funktioniert so …', 2000, true],
    ['einsatz', 'Ich habe es verwendet für …', 2000, false],
    ['weitere', 'Man könnte es auch brauchen für …', 2000, false],
    ['tags', 'Schlagwörter', 200, false],
    ['von', 'Erstellt von', 80, false],
    ['prompt', 'Prompt / Anweisungen', 20000, true], // muss das letzte Feld sein
  ],
  web: [
    ['name', 'Name', 120, true],
    ['url', 'Website-Link', 500, false],
    ['kategorie', 'Kategorie', 60, true],
    ['plattform', 'Plattform', 60, true],
    ['beschreibung', 'Das Tool ist für …', 200, true],
    ['funktion', 'Es funktioniert so …', 2000, true],
    ['weitere', 'Man könnte es auch brauchen für …', 2000, false],
    ['tags', 'Schlagwörter', 200, false],
    ['von', 'Empfohlen von', 80, false],
  ],
};

const antwort = (data, status, headers) =>
  new Response(JSON.stringify(data), { status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' } });

function bereinigen(wert, max, istPrompt) {
  let s = String(wert ?? '').replace(/\r\n/g, '\n').trim().slice(0, max);
  // Ausser im Prompt keine Überschriften zulassen, damit niemand die Feld-Struktur des Issues stört.
  if (!istPrompt) s = s.replace(/^\s*#+\s*/gm, '');
  return s;
}

function github(env, pfad, methode = 'GET', daten) {
  return fetch(`https://api.github.com/repos/${env.REPO}${pfad}`, {
    method: methode,
    headers: {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'toolbox-einreichen',
      'Content-Type': 'application/json',
    },
    body: daten ? JSON.stringify(daten) : undefined,
  });
}

// Vergleich in konstanter Zeit, damit das Passwort nicht Zeichen für Zeichen erraten werden kann.
function gleich(a, b) {
  const x = new TextEncoder().encode(String(a));
  const y = new TextEncoder().encode(String(b));
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

// Issue-Text ("### Label\n\nWert") wieder in Felder zerlegen, für die Vorschau in der Moderation.
function felderAusIssue(body) {
  body = (body || '').replace(/\r\n/g, '\n');
  const felder = [];
  const kopf = '### Prompt / Anweisungen';
  const p = body.indexOf(kopf);
  for (const chunk of (p >= 0 ? body.slice(0, p) : body).split(/^### /m).slice(1)) {
    const nl = chunk.indexOf('\n');
    const label = (nl < 0 ? chunk : chunk.slice(0, nl)).trim();
    const wert = (nl < 0 ? '' : chunk.slice(nl + 1)).trim();
    if (wert && wert !== '_No response_') felder.push([label, wert]);
  }
  if (p >= 0) felder.push(['Prompt / Anweisungen', body.slice(p + kopf.length).trim()]);
  return felder;
}

async function einreichen(d, env, cors) {
  // Honeypot: Menschen lassen dieses unsichtbare Feld leer. Bots bekommen ein stilles "ok".
  if (d.website) return antwort({ ok: true }, 200, cors);

  if (env.KURS_CODE && String(d.kursCode || '').trim().toLowerCase() !== env.KURS_CODE.trim().toLowerCase()) {
    return antwort({ fehler: 'Der Kurs-Code stimmt nicht.' }, 403, cors);
  }

  const typ = d.typ === 'web' ? 'web' : 'skill';
  const felder = FELDER[typ];
  const werte = {};
  for (const [key, label, max, pflicht] of felder) {
    werte[key] = bereinigen(d[key], max, key === 'prompt');
    if (pflicht && !werte[key]) return antwort({ fehler: `Bitte fülle das Feld «${label}» aus.` }, 400, cors);
  }
  if (!KATEGORIEN.includes(werte.kategorie)) return antwort({ fehler: 'Unbekannte Kategorie.' }, 400, cors);
  if (werte.url && !/^https?:\/\/[^\s]+\.[^\s]+$/i.test(werte.url)) {
    return antwort({ fehler: 'Der Link muss mit https:// beginnen.' }, 400, cors);
  }

  const body = felder.map(([key, label]) => `### ${label}\n\n${werte[key] || '_No response_'}`).join('\n\n');
  const title = `${typ === 'skill' ? 'KI-Skill' : 'Web-Tool'}: ${werte.name.replace(/\s+/g, ' ')}`;

  const res = await github(env, '/issues', 'POST', { title, body, labels: ['eingereicht'] });
  if (!res.ok) {
    console.log('GitHub-Fehler', res.status, await res.text());
    return antwort({ fehler: 'Die Einreichung konnte gerade nicht gespeichert werden. Bitte versuch es später nochmals.' }, 502, cors);
  }

  // Automatische Freigabe: Das Label "freigegeben" startet den Workflow, der den Eintrag veröffentlicht.
  const auto = String(env.AUTO_FREIGABE || '').trim().toLowerCase() !== 'nein';
  if (auto) {
    const { number } = await res.json();
    const r = await github(env, `/issues/${number}/labels`, 'POST', { labels: ['freigegeben'] });
    if (!r.ok) {
      // Kein Drama: Die Einreichung liegt trotzdem vor und kann in der Moderation freigegeben werden.
      console.log('Automatische Freigabe fehlgeschlagen', r.status, await r.text());
      return antwort({ ok: true, auto: false }, 200, cors);
    }
  }
  return antwort({ ok: true, auto }, 200, cors);
}

async function moderation(d, env, cors) {
  if (!env.MOD_CODE) return antwort({ fehler: 'Die Moderation ist noch nicht eingerichtet (MOD_CODE fehlt im Worker).' }, 503, cors);
  if (!gleich(String(d.modCode || '').trim(), env.MOD_CODE.trim())) {
    await new Promise((r) => setTimeout(r, 800)); // Raten bremsen
    return antwort({ fehler: 'Das Moderations-Passwort stimmt nicht.' }, 403, cors);
  }

  if (d.aktion === 'liste') {
    const res = await github(env, '/issues?state=open&labels=eingereicht&per_page=50&sort=created&direction=asc');
    if (!res.ok) {
      console.log('GitHub-Fehler', res.status, await res.text());
      return antwort({ fehler: 'Die Einreichungen konnten nicht geladen werden.' }, 502, cors);
    }
    const issues = await res.json();
    return antwort({
      ok: true,
      einreichungen: issues
        .filter((i) => !i.pull_request && !i.labels.some((l) => l.name === 'freigegeben'))
        .map((i) => ({
          nummer: i.number,
          titel: i.title,
          typ: i.title.startsWith('Web-Tool') ? 'web' : 'skill',
          erstellt: i.created_at,
          url: i.html_url,
          felder: felderAusIssue(i.body),
        })),
    }, 200, cors);
  }

  const nummer = Number(d.nummer);
  if (!Number.isInteger(nummer) || nummer < 1) return antwort({ fehler: 'Ungültige Einreichung.' }, 400, cors);

  // Nur offene Einreichungen anfassen, nichts anderes im Repository.
  const res = await github(env, `/issues/${nummer}`);
  if (!res.ok) return antwort({ fehler: 'Einreichung nicht gefunden.' }, 404, cors);
  const issue = await res.json();
  if (issue.state !== 'open' || !issue.labels.some((l) => l.name === 'eingereicht')
      || issue.labels.some((l) => l.name === 'freigegeben')) {
    return antwort({ fehler: 'Diese Einreichung wurde schon bearbeitet.' }, 409, cors);
  }

  if (d.aktion === 'freigeben') {
    const r = await github(env, `/issues/${nummer}/labels`, 'POST', { labels: ['freigegeben'] });
    if (!r.ok) return antwort({ fehler: 'Freigeben hat nicht geklappt.' }, 502, cors);
    return antwort({ ok: true }, 200, cors);
  }

  if (d.aktion === 'ablehnen') {
    const r = await github(env, `/issues/${nummer}`, 'PATCH', { state: 'closed', state_reason: 'not_planned' });
    if (!r.ok) return antwort({ fehler: 'Ablehnen hat nicht geklappt.' }, 502, cors);
    return antwort({ ok: true }, 200, cors);
  }

  return antwort({ fehler: 'Unbekannte Aktion.' }, 400, cors);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const erlaubt = (env.ALLOWED_ORIGIN || '').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);
    const cors = {
      'Access-Control-Allow-Origin': erlaubt.includes(origin) ? origin : (erlaubt[0] || '*'),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return antwort({ fehler: 'Nur POST erlaubt.' }, 405, cors);
    if (erlaubt.length && !erlaubt.includes(origin)) return antwort({ fehler: 'Diese Seite darf nicht einreichen.' }, 403, cors);

    let d;
    try {
      d = await request.json();
    } catch {
      return antwort({ fehler: 'Ungültige Anfrage.' }, 400, cors);
    }

    const pfad = new URL(request.url).pathname.replace(/\/$/, '');
    if (pfad === '/moderation') return moderation(d, env, cors);
    return einreichen(d, env, cors);
  },
};
