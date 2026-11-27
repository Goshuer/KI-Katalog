// Cloudflare Worker: nimmt Einreichungen aus der Toolbox-Eingabemaske entgegen
// und legt sie als GitHub-Issue mit dem Label "eingereicht" an.
// Die Moderation läuft danach wie gewohnt über das Label "freigegeben".
//
// Einstellungen im Worker (Settings → Variables and Secrets):
//   GITHUB_TOKEN    (Secret)  Fine-grained Token, nur für dieses Repository, Recht "Issues: Read and write"
//   REPO            (Text)    z. B. Goshuer/KI-Katalog
//   ALLOWED_ORIGIN  (Text)    z. B. https://goshuer.github.io   (mehrere mit Komma trennen)
//   KURS_CODE       (Secret)  optional: Code, den man zum Einreichen kennen muss

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

    const res = await fetch(`https://api.github.com/repos/${env.REPO}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'toolbox-einreichen',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, body, labels: ['eingereicht'] }),
    });

    if (!res.ok) {
      console.log('GitHub-Fehler', res.status, await res.text());
      return antwort({ fehler: 'Die Einreichung konnte gerade nicht gespeichert werden. Bitte versuch es später nochmals.' }, 502, cors);
    }
    return antwort({ ok: true }, 200, cors);
  },
};
