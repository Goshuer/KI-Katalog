---
name: Mach deine Voice-Over besser
kategorie: media
von: 
plattform: Mehrere / andere
beschreibung: Verbessert deine Voice-Over-Aufnahmem
tags: 
hinzugefuegt: 2026-11-27
---

## So funktioniert es

Einfach Voice-Over als WAV hochladen und dann bearbeiten lassen.

## Prompt

---
name: voiceover-kette
description: Bearbeitet gesprochene Voiceover-Aufnahmen (WAV, MP3) für Erklärvideos, YouTube, Podcasts oder Broadcast. Senkt Atmer automatisch ab, gibt der Stimme Wärme und Präsenz (EQ, De-Esser, Kompressor) und bringt sie auf Ziel-Lautheit. Verwenden, wenn jemand ein Voiceover, eine Sprachaufnahme oder eine Vertonung verbessern, aufbereiten, mastern oder von Atmern befreien möchte.
Voiceover-Kette
Eine erprobte Bearbeitungskette für Sprachaufnahmen mit einfachen USB-Mikrofonen. Sie gleicht den typischen dumpfen, bassigen Klang günstiger Kondensatormikrofone aus, senkt Atmer ab und liefert ein fertiges 24-bit-WAV auf Ziel-Lautheit.
Diese Datei ist in sich vollständig: Das Skript steht weiter unten. Sie funktioniert mit jedem KI-Assistenten, der Python ausführen kann (zum Beispiel Claude, ChatGPT, Copilot mit Codeausführung).
Ablauf
Codeausführung prüfen. Kannst du Python ausführen und Dateien lesen und schreiben? Wenn nein, weiter mit «Ohne Codeausführung» unten.
Skript anlegen. Den Code-Block unter «Skript» unverändert als Datei `voiceover_kette.py` speichern. Nichts daran ändern oder kürzen: Die Einstellungen sind abgestimmt und sollen bei jeder Folge gleich klingen.
Voraussetzungen. Benötigt werden `numpy` und `scipy`. Fehlen sie, installieren (`pip install numpy scipy`). Für WAV-Dateien ist sonst nichts nötig. Für MP3 und andere Formate braucht es `ffmpeg`; fehlt es, die Person bitten, die Datei als WAV zu exportieren.
Ziel klären, falls nicht genannt. Standard ist YouTube.
YouTube / Erklärvideo: `--target -14`
Podcast / Web: `--target -16`
Broadcast (EBU R128): `--target -23`
Ausführen. Hochgeladene Originale nie überschreiben.
```
   python3 voiceover_kette.py EINGABE.wav --out EINGABE_bearbeitet.wav --ab 30
   ```
Optionen:
`--preset warm` (Standard) oder `--preset klar` (heller, schlanker)
`--breath-db 12`: Absenkung der Atmer in dB (40 ≈ ganz weg); `--no-breath` schaltet die Atmer-Bearbeitung aus
`--force 0:36.7,1:11.0`: unsichere Stellen trotzdem absenken, nachdem die Person sie als Atmer bestätigt hat
`--ab SEKUNDE`: 15-Sekunden-Vergleich ab dieser Stelle (Original, 1 s Stille, bearbeitet, gleich laut)
Das Skript gibt am Schluss JSON aus: Lautheit und Peak vorher und nachher, Gain, Anzahl abgesenkter Atmer und die Liste der unsicheren Stellen.
Übergeben: das bearbeitete WAV, den A/B-Ausschnitt und die Atmer-Liste (`*_atmer.txt`). Kurz sagen, was geändert wurde, und die Messwerte nennen.
Unsichere Stellen ansprechen. Die Liste nennt Stellen, die nur vielleicht Atmer sind (zu laut, evtl. «h», «f», «sch», oder eher ein Wortende). Die Person bitten, dort reinzuhören. Bestätigte Stellen mit `--force` neu rechnen.
Wichtig
Die KI kann nicht hören, nur messen. Klangliche Aussagen als Messwerte formulieren («viel Energie unter 300 Hz», «Präsenz +3 dB»). Ob es gut klingt, entscheidet die Person.
Wünscht die Person mehr Wärme: Preset `warm` (Standard). Klingt es zu dumpf: Preset `klar`.
Für eine Videoreihe immer dieselben Einstellungen verwenden, damit alle Folgen gleich klingen.
Ohne Codeausführung
Dann die Person durch die Bearbeitung in ihrem Audioprogramm führen, mit den Werten aus der Tabelle. Beispiel Reaper (als FX-Chain speichern: Rechtsklick im FX-Fenster → «Save chain…»):
Atmer (vor der Kette, von Hand): am Atmer splitten (Taste S), Item-Lautstärke −12 dB, Fades 15 ms.
ReaEQ: Bänder wie in der Tabelle.
JS: De-esser: Frequenz ca. 5500 Hz, maximale Reduktion ca. 4 dB.
ReaComp: Threshold −22 dB, Ratio 2:1, Attack 8 ms, Release 90 ms, Knee 3 dB.
Render: File → Render → Normalize/Limit → LUFS-I −14 (YouTube), Brickwall True Peak −1.5 dB, WAV 24 bit.
In Audacity, Adobe Audition oder DaVinci Resolve (Fairlight) gibt es gleichwertige Werkzeuge: parametrischer EQ, De-Esser, Kompressor, Loudness-Normalisierung.
Was die Kette macht
Schritt	Warm (Standard)	Klar
Atmer	−12 dB, 15-ms-Blenden, nur in Sprechpausen	gleich
Hochpass	75 Hz	75 Hz
EQ 1	Peak 170 Hz, +1.5 dB, Q 0.9 (Wärme)	Peak 120 Hz, −1.5 dB, Q 1
EQ 2	Peak 320 Hz, −2 dB, Q 1.4 (weniger Mulm)	Peak 250 Hz, −2.5 dB, Q 1.2
EQ 3	Peak 3.5 kHz, +2 dB, Q 1 (Präsenz)	Peak 3.5 kHz, +2.5 dB, Q 1
EQ 4	High-Shelf 10 kHz, +1.5 dB (Luft)	High-Shelf 9 kHz, +2.5 dB
De-Esser	sanft (0.35)	0.4
Kompressor	−22 dB, 2:1, Attack 8 ms, Release 90 ms	gleich
Ausgang	Gain auf Ziel-LUFS, Limiter −1.5 dBFS, WAV 24 bit	gleich
Atmer-Erkennung: Analyse in 30-ms-Fenstern. Ein Atmer liegt in einer stimmlosen Pause von mindestens 250 ms, dauert 100–600 ms, hat keine Tonhöhe, einen Frequenzschwerpunkt zwischen 900 und 4200 Hz und liegt mindestens 30 dB unter der Sprechlautstärke. Alle Schwellen gelten relativ zur Sprechlautstärke der Aufnahme. Was nicht alle Kriterien erfüllt, wird als «unsicher» gelistet und nicht verändert.
Skript
```python
#!/usr/bin/env python3
"""Voiceover-Kette – Atmer absenken, warme Sprachbearbeitung, Ziel-Lautheit.
Nur Python + numpy + scipy. ffmpeg nur nötig, wenn die Eingabe kein WAV ist.

python3 voiceover_kette.py EINGABE.wav [--out AUSGABE.wav] [--preset warm|klar]
        [--target -14] [--breath-db 12] [--no-breath] [--force 0:36.7,1:11.0] [--ab 30]
"""
import argparse, json, os, shutil, subprocess, sys, tempfile, warnings
warnings.filterwarnings("ignore")
import numpy as np
from scipy.io import wavfile
from scipy.signal import lfilter
from scipy.ndimage import minimum_filter1d, uniform_filter1d

PRESETS = {  # (typ, Hz, dB, Q)
    "warm": dict(eq=[("hp", 75, 0, .707), ("peak", 170, 1.5, .9), ("peak", 320, -2, 1.4),
                     ("peak", 3500, 2, 1.0), ("hshelf", 10000, 1.5, .707)], deess=.35),
    "klar": dict(eq=[("hp", 75, 0, .707), ("peak", 120, -1.5, 1.0), ("peak", 250, -2.5, 1.2),
                     ("peak", 3500, 2.5, 1.0), ("hshelf", 9000, 2.5, .707)], deess=.40),
}
COMP = dict(thr=-22.0, ratio=2.0, att=8.0, rel=90.0)
CEIL_DB = -1.5


# ---------- Ein-/Ausgabe ----------
def read_audio(path):
    if not path.lower().endswith(".wav"):
        exe = shutil.which("ffmpeg")
        if not exe:
            try:
                import imageio_ffmpeg; exe = imageio_ffmpeg.get_ffmpeg_exe()
            except Exception:
                sys.exit("Eingabe ist kein WAV und ffmpeg fehlt. Bitte die Datei als WAV exportieren.")
        tmp = os.path.join(tempfile.mkdtemp(), "in.wav")
        subprocess.run([exe, "-y", "-loglevel", "error", "-i", path, "-c:a", "pcm_f32le", tmp], check=True)
        path = tmp
    sr, x = wavfile.read(path)
    if x.dtype == np.int16: x = x / 32768.0
    elif x.dtype == np.int32: x = x / 2147483648.0
    elif x.dtype == np.uint8: x = (x - 128) / 128.0
    x = x.astype(np.float64)
    return sr, x[:, None] if x.ndim == 1 else x


def write_wav24(path, sr, x):
    x = np.clip(x, -1, 1)
    q = np.round(x * 8388607).astype(np.int32).reshape(-1)
    b = q.view(np.uint8).reshape(-1, 4)[:, :3].tobytes()
    nc = x.shape[1]
    import struct
    with open(path, "wb") as f:
        f.write(b"RIFF" + struct.pack("<I", 36 + len(b)) + b"WAVE")
        f.write(b"fmt " + struct.pack("<IHHIIHH", 16, 1, nc, sr, sr * nc * 3, nc * 3, 24))
        f.write(b"data" + struct.pack("<I", len(b)) + b)


# ---------- DSP ----------
def coefs(t, f, g, q, sr):
    w = 2 * np.pi * f / sr; c, s = np.cos(w), np.sin(w); al = s / (2 * q); A = 10 ** (g / 40); sA = 2 * np.sqrt(A) * al
    if t == "hp":
        b = [(1 + c) / 2, -(1 + c), (1 + c) / 2]; a = [1 + al, -2 * c, 1 - al]
    elif t == "peak":
        b = [1 + al * A, -2 * c, 1 - al * A]; a = [1 + al / A, -2 * c, 1 - al / A]
    elif t == "hshelf":
        b = [A * ((A + 1) + (A - 1) * c + sA), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - sA)]
        a = [(A + 1) - (A - 1) * c + sA, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - sA]
    else:  # lshelf
        b = [A * ((A + 1) - (A - 1) * c + sA), 2 * A * ((A - 1) - (A + 1) * c), A * ((A + 1) - (A - 1) * c - sA)]
        a = [(A + 1) + (A - 1) * c + sA, -2 * ((A - 1) + (A + 1) * c), (A + 1) + (A - 1) * c - sA]
    return np.array(b) / a[0], np.array(a) / a[0]


def filt(x, t, f, g, q, sr):
    b, a = coefs(t, f, g, q, sr); return lfilter(b, a, x, axis=0)


def lufs(x, sr):
    y = filt(x, "hshelf", 1681.974450955533, 3.999843853973347, .7071752369554196, sr)
    y = filt(y, "hp", 38.13547087602444, 0, .5003270373238773, sr)
    hop = int(round(.1 * sr)); nseg = len(y) // hop
    seg = (y[:nseg * hop] ** 2).reshape(nseg, hop, -1).sum(1)
    if nseg < 4: return -np.inf
    pw = (seg[:-3] + seg[1:-2] + seg[2:-1] + seg[3:]).sum(1) / (4 * hop)
    L = -0.691 + 10 * np.log10(pw + 1e-30)
    g = pw[L > -70]
    if not len(g): return -np.inf
    rel = -0.691 + 10 * np.log10(g.mean()) - 10
    g = pw[(L > -70) & (L > rel)]
    return float(-0.691 + 10 * np.log10(g.mean())) if len(g) else -np.inf


def block_env(v, sr, blk, att_ms, rel_ms):
    """Hüllkurve auf 1-ms-Blöcken (schnell, ohne Sample-Schleife)."""
    aA = np.exp(-blk / (att_ms / 1000 * sr)); aR = np.exp(-blk / (rel_ms / 1000 * sr))
    e = np.empty_like(v); p = 0.0
    for i, s in enumerate(v):
        p = aA * p + (1 - aA) * s if s > p else aR * p + (1 - aR) * s
        e[i] = p
    return e


def to_samples(gb, blk, n):
    centers = np.arange(len(gb)) * blk + blk / 2
    return np.interp(np.arange(n), centers, gb)


def deess(x, sr, amount):
    if amount <= 0: return x
    n = len(x); blk = max(1, int(sr / 1000)); nb = n // blk
    h = filt(filt(x, "hp", 5000, 0, .707, sr), "hp", 5000, 0, .707, sr)
    ph = np.abs(h[:nb * blk]).max(1).reshape(nb, blk).max(1)
    pf = np.abs(x[:nb * blk]).max(1).reshape(nb, blk).max(1)
    eh, ef = block_env(ph, sr, blk, 1, 40), block_env(pf, sr, blk, 1, 40)
    r = 20 * np.log10((eh + 1e-12) / (ef + 1e-12))
    red = np.where((ef > 1e-4) & (r > -9), np.minimum(12 * amount, (r + 9) * 1.5), 0)
    g = to_samples(10 ** (-red / 20), blk, n)
    return x - h * (1 - g)[:, None]


def compress(x, sr, thr, ratio, att, rel):
    n = len(x); blk = max(1, int(sr / 1000)); nb = n // blk
    ms = (x[:nb * blk] ** 2).max(1).reshape(nb, blk).mean(1)
    env = block_env(ms, sr, blk, att, rel)
    over = 10 * np.log10(env + 1e-20) - thr; knee = 2.8284; sl = 1 / ratio - 1
    gr = np.where(2 * over < -knee, 0, np.where(2 * np.abs(over) <= knee, sl * (over + knee / 2) ** 2 / (2 * knee), sl * over))
    return x * to_samples(10 ** (gr / 20), blk, n)[:, None]


def limit(x, sr, ceil_db):
    ceil = 10 ** (ceil_db / 20); L = max(1, int(round(.003 * sr)))
    p = np.abs(x).max(1); t = np.where(p > ceil, ceil / np.maximum(p, 1e-12), 1.0)
    m = minimum_filter1d(t, 2 * L + 1); r = np.minimum(uniform_filter1d(m, 2 * L + 1), m)
    return np.clip(x * r[:, None], -ceil, ceil)


# ---------- Atmer ----------
def detect_breaths(x, sr):
    hop, win = int(round(.01 * sr)), int(round(.03 * sr)); n = max(0, (len(x) - win) // hop)
    N = 1
    while N < win + int(np.ceil(sr / 70)) + 2: N <<= 1
    hann = np.hanning(win); fr = np.fft.rfftfreq(N, 1 / sr); lo, hi_l = int(sr / 400), int(sr / 70)
    rms = np.empty(n); V = np.zeros(n); hi = np.zeros(n); cent = np.zeros(n)
    for s in range(0, n, 2000):
        e = min(n, s + 2000); raw = x[np.arange(win)[None, :] + hop * np.arange(s, e)[:, None]]
        rms[s:e] = 20 * np.log10(np.sqrt((raw ** 2).mean(1)) + 1e-12)
        F = raw * hann; F -= F.mean(1, keepdims=True)
        P = np.abs(np.fft.rfft(F, N, axis=1)) ** 2; tot = P.sum(1) + 1e-20
        hi[s:e] = P[:, fr >= 4000].sum(1) / tot; cent[s:e] = (P * fr).sum(1) / tot
        ac = np.fft.irfft(P, N, axis=1); a0 = ac[:, 0]
        V[s:e] = np.where(a0 > 0, ac[:, lo:hi_l].max(1) / np.where(a0 > 0, a0, 1), 0)
    q = rms < -70; V[q] = 0; hi[q] = 0; cent[q] = 0
    vl = rms[(V > .5) & (rms > -60)]; off = (np.median(vl) + 15.1) if len(vl) else 0.0
    v = (V > .45) & (rms > -40 + off)
    for i in range(1, n - 2):
        if not v[i] and v[i - 1] and (v[i + 1] or v[i + 2]): v[i] = True
    out, i = [], 0
    while i < n:
        if v[i]: i += 1; continue
        j = i
        while j < n and not v[j]: j += 1
        if j - i >= 25:
            a = i + 6 if i > 0 else i; b = j - 4 if j < n else j
            act = (rms[a:b] > -58 + off) & (cent[a:b] < 4200) & (hi[a:b] < .4); k, L = 0, len(act)
            while k < L:
                if not act[k]: k += 1; continue
                m = k
                while m < L and (act[m] or (m + 3 < L and act[m + 1:m + 4].any())): m += 1
                if m - k >= 10:
                    s0, e0 = a + k, a + m; lv = rms[s0:e0].max() - off; c = cent[s0:e0].mean()
                    dur = (e0 - s0) * hop / sr * 1000
                    sure = 900 <= c <= 4200 and lv <= -30 and 100 <= dur <= 600
                    out.append(dict(start=s0 * hop / sr, end=e0 * hop / sr, dur=round(dur), sure=bool(sure),
                                    why="" if sure else ("zu laut, evtl. Konsonant" if lv > -30 else "eher Wortende oder Geräusch")))
                k = m
        i = j
    return out


def apply_breaths(x, sr, breaths, db):
    red = 10 ** (-db / 20); f = int(round(.015 * sr)); n = len(x); g = np.ones(n)
    for b in breaths:
        if not (b["sure"] or b.get("force")): continue
        s, e = int(round(b["start"] * sr)), min(n, int(round(b["end"] * sr)))
        g[s:e] = np.minimum(g[s:e], red)
        s0 = max(0, s - f); g[s0:s] = np.minimum(g[s0:s], np.linspace(1, red, s - s0))
        e1 = min(n, e + f); g[e:e1] = np.minimum(g[e:e1], np.linspace(red, 1, e1 - e))
    return x * g[:, None]


def fmt(t): return f"{int(t // 60)}:{t % 60:05.2f}"


def parse_time(t):
    t = t.strip()
    if ":" in t: m, s = t.split(":"); return int(m) * 60 + float(s)
    return float(t)


# ---------- Ablauf ----------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input"); ap.add_argument("--out")
    ap.add_argument("--preset", default="warm", choices=PRESETS)
    ap.add_argument("--target", type=float, default=-14.0)
    ap.add_argument("--breath-db", type=float, default=12.0)
    ap.add_argument("--no-breath", action="store_true")
    ap.add_argument("--force", default="")
    ap.add_argument("--ab", type=float)
    a = ap.parse_args()
    base = os.path.splitext(a.out or os.path.splitext(a.input)[0] + "_bearbeitet.wav")[0]

    sr, src = read_audio(a.input)
    dual = src.shape[1] == 2 and np.array_equal(src[:, 0], src[:, 1])
    x = src[:, :1].copy() if dual else src.copy()
    lufs_in = lufs(src, sr); peak_in = 20 * np.log10(np.abs(src).max() + 1e-12)

    breaths = [] if a.no_breath else detect_breaths(x.mean(1), sr)
    for t in filter(None, a.force.split(",")):
        sec = parse_time(t)
        for b in breaths:
            if not b["sure"] and abs(b["start"] - sec) < .3: b["force"] = True
    if breaths and a.breath_db > 0: x = apply_breaths(x, sr, breaths, a.breath_db)

    P = PRESETS[a.preset]
    for t, f, g, q in P["eq"]: x = filt(x, t, f, g, q, sr)
    x = deess(x, sr, P["deess"])
    x = compress(x, sr, **COMP)

    out_ch = lambda y: np.repeat(y, 2, axis=1) if dual else y
    gain = a.target - lufs(out_ch(x), sr)
    for _ in range(3):
        y = limit(x * 10 ** (gain / 20), sr, CEIL_DB)
        l_out = lufs(out_ch(y), sr)
        if abs(a.target - l_out) < .15: break
        gain += a.target - l_out
    y = out_ch(y); write_wav24(base + ".wav", sr, y)

    on = [b for b in breaths if b["sure"] or b.get("force")]
    uns = [b for b in breaths if not (b["sure"] or b.get("force"))]
    with open(base + "_atmer.txt", "w", encoding="utf-8") as fh:
        fh.write(f"Atmer – {os.path.basename(a.input)}\n\nABGESENKT (-{a.breath_db:g} dB): {len(on)}\n")
        for b in on: fh.write(f"  {fmt(b['start'])} – {fmt(b['end'])}  ({b['dur']} ms){'  [manuell]' if b.get('force') else ''}\n")
        fh.write(f"\nNICHT BEARBEITET (unsicher, bitte reinhören): {len(uns)}\n")
        for b in uns: fh.write(f"  {fmt(b['start'])} – {fmt(b['end'])}  ({b['dur']} ms)  {b['why']}\n")

    ab = None
    if a.ab is not None:
        s, e = int(a.ab * sr), int((a.ab + 15) * sr)
        A = src[s:e] * 10 ** ((l_out - lufs_in) / 20)
        if A.shape[1] != y.shape[1]: A = np.repeat(A[:, :1], y.shape[1], axis=1)
        ab = base + "_AB.wav"
        write_wav24(ab, sr, np.concatenate([A, np.zeros((sr, y.shape[1])), y[s:e]]))

    print(json.dumps(dict(output=base + ".wav", breaths_file=base + "_atmer.txt", ab=ab,
                          lufs_in=round(lufs_in, 1), peak_in=round(float(peak_in), 1),
                          lufs_out=round(l_out, 1), peak_out=round(float(20 * np.log10(np.abs(y).max() + 1e-12)), 1),
                          gain_db=round(gain, 1), breaths_reduced=len(on), breaths_unsure=[fmt(b["start"]) for b in uns]),
                     ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
```
