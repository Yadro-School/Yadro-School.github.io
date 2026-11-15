#!/usr/bin/env node
/* Ворота перед выкаткой сайта «Ядро».
   Запуск:  node tools/gate.js            — проверки по файлам
            node tools/gate.js --browser  — ещё и в браузере (нужен Playwright: значки и картинки реально рисуются)
            node tools/gate.js --live https://yadro-ed.ru — те же пути на живом сайте отвечают 200
   Выход 0 и «ВОРОТА ПРОЙДЕНЫ» — можно публиковать. Любая ошибка — выход 1. */
const fs = require("fs"), path = require("path"), ROOT = path.join(__dirname, ".."), args = process.argv.slice(2);
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8"), bad = [], ok = [];
const fail = m => bad.push(m), pass = m => ok.push(m);
const IMG = /\.(png|jpe?g|webp|gif|svg|ico)$/i, MAGIC = { png: "89504e47", jpg: "ffd8ff", jpeg: "ffd8ff", gif: "47494638", webp: "52494646", ico: "00000100" };
const looksImg = (buf, ext) => ext === "svg" ? /<svg[\s>]/.test(buf.toString("utf8", 0, 2000)) && /<\/svg>\s*$/.test(buf.toString("utf8")) : buf.toString("hex", 0, 4).startsWith(MAGIC[ext] || "??");

/* 1. скрипты страницы без синтаксических ошибок */
{ const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g; let m, n = 0, e = 0;
  while((m = re.exec(html))){ n++; try { new Function(m[1]); } catch(x) { e++; fail("скрипт №" + n + ": " + x.message); } }
  if(!e) pass(n + " встроенных скриптов без ошибок синтаксиса"); }

/* 2. все свои файлы, на которые ссылается страница, лежат в репозитории */
const local = new Set();
for(const m of html.matchAll(/(?:src|href)=["']([^"'#?\s>]+)/g)) local.add(m[1]);
for(const m of html.matchAll(/url\(\s*["']?([^"')\s]+)/g)) local.add(m[1]);
for(const m of html.matchAll(/VEND\("([^"]+)"\)/g)) local.add("vendor/" + m[1]);
for(const m of html.matchAll(/["'`]((?:images|vendor)\/[\w./-]+\.\w+)["'`]/g)) local.add(m[1]);
["favicon.ico", "apple-touch-icon.png", "apple-touch-icon-precomposed.png", "CNAME"].forEach(f => local.add(f));   // браузеры и iOS просят их сами
const files = [...local].filter(u => !/^(https?:|data:|blob:|mailto:|tel:|javascript:|\/\/|\$\{|#)/.test(u) && !u.includes("${") && /\.\w{2,5}$|^CNAME$/.test(u));
{ let miss = 0; for(const f of files){ const p = path.join(ROOT, f.replace(/^\//, "")); if(f === "vendor/tesseract-core" || f === "vendor/lang") continue;
    if(!fs.existsSync(p)){ miss++; fail("нет файла: " + f + " (на сайте будет 404)"); continue; }
    const ext = (f.match(/\.(\w+)$/) || [])[1]; if(IMG.test(f)){ const buf = fs.readFileSync(p); if(!buf.length || !looksImg(buf, ext.toLowerCase())){ miss++; fail("файл не похож на картинку " + ext + ": " + f); } } }
  for(const d of ["vendor/tesseract-core/tesseract-core-lstm.wasm.js", "vendor/tesseract-core/tesseract-core-simd-lstm.wasm.js", "vendor/lang/rus.traineddata.gz"]) if(!fs.existsSync(path.join(ROOT, d))){ miss++; fail("нет файла: " + d); }
  if(!miss) pass(files.length + " своих файлов на месте, картинки целые: " + files.filter(f => IMG.test(f)).join(", ")); }

/* 3. встроенные картинки (data:) — значки входа AUTH_ICONS и прочие — расшифровываются и являются картинками */
{ let n = 0, e = 0; const seen = new Set();
  for(const m of html.matchAll(/data:image\/(svg\+xml|png|jpe?g|webp|gif)(;charset=[\w-]+)?(;base64)?,([A-Za-z0-9+/=%_.~!*'()<>\-:;,#?&@ ]{20,})/g)){
    if(m[0].includes("${")) continue; const key = m[0].slice(0, 400); if(seen.has(key)) continue; seen.add(key); n++;
    const ext = m[1] === "svg+xml" ? "svg" : m[1]; let buf;
    try { buf = m[3] ? Buffer.from(m[4].replace(/[^A-Za-z0-9+/=]/g, ""), "base64") : Buffer.from(decodeURIComponent(m[4].replace(/["')\s].*$/, "")), "utf8"); } catch(x) { e++; fail("data:-картинка не расшифровывается: " + m[0].slice(0, 60)); continue; }
    if(m[3] && !looksImg(buf, ext)){ e++; fail("data:-картинка испорчена (" + ext + "): " + m[0].slice(0, 60)); } }
  const ai = html.match(/const AUTH_ICONS = \{([\s\S]*?)\};\n/), keys = ai ? [...ai[1].matchAll(/(\w+): "([^"]*)"/g)] : [];
  if(!ai || !keys.length){ e++; fail("AUTH_ICONS не найден или пуст"); }
  for(const k of keys) if(!/^data:image\//.test(k[2]) && !fs.existsSync(path.join(ROOT, k[2]))){ e++; fail("значок входа «" + k[1] + "»: нет файла " + k[2]); }
  if(!e) pass(n + " встроенных картинок целые, значки входа: " + keys.map(k => k[1]).join(", ")); }

/* 4. защита страницы и сборка */
{ if(!/<meta http-equiv="Content-Security-Policy"/.test(html.slice(0, 3000))) fail("в начале <head> нет Content-Security-Policy"); else pass("CSP на месте");
  for(const m of html.matchAll(/<script[^>]+src=["'](https?:)?\/\/([^"'/]+)/g)) fail("скрипт с чужого адреса: " + m[2]);
  const b = html.match(/const BUILD = "(\d+)"/); if(!b) fail("нет номера сборки BUILD"); else pass("сборка " + b[1]); }

(async () => {
  /* 5. живой сайт: те же пути отвечают 200 */
  const li = args.indexOf("--live");
  if(li >= 0){ const base = String(args[li + 1] || "https://yadro-ed.ru").replace(/\/$/, ""); let e = 0;
    const list = ["", ...files.filter(f => f !== "CNAME")];
    for(const f of list){ try { const r = await fetch(base + "/" + f + (f ? "?gate=" + Date.now() : ""), { method: "GET" }); if(r.status !== 200){ e++; fail("живой сайт: " + r.status + " — /" + f); } else if(IMG.test(f) && !/image|octet/.test(r.headers.get("content-type") || "")){ e++; fail("живой сайт: /" + f + " отдаётся не как картинка"); } } catch(x) { e++; fail("живой сайт: /" + f + " — " + x.message); } }
    if(!e) pass("живой сайт " + base + ": " + list.length + " путей отвечают 200"); }
  /* 6. браузер: значки и картинки действительно рисуются, страница без ошибок */
  if(args.includes("--browser")){ let pw; try { pw = require("playwright"); } catch(x) { fail("нет Playwright для проверки в браузере (NODE_PATH=$(npm root -g))"); }
    if(pw){ const http = require("http"), TYPES = { html: "text/html; charset=utf-8", js: "text/javascript", svg: "image/svg+xml", png: "image/png", ico: "image/vnd.microsoft.icon", gz: "application/gzip" };
      const srv = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split("?")[0]).replace(/^\/$/, "/index.html")); if(!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ s.writeHead(404); return s.end("404"); } s.writeHead(200, { "Content-Type": TYPES[f.split(".").pop()] || "application/octet-stream" }); fs.createReadStream(f).pipe(s); });
      await new Promise(r => srv.listen(0, "127.0.0.1", r)); const url = "http://127.0.0.1:" + srv.address().port + "/";
      const br = await pw.chromium.launch();
      for(const vw of [1300, 390]){ const p = await br.newPage({ viewport: { width: vw, height: 900 } }), errs = [], s404 = [];
        p.on("pageerror", x => errs.push(x.message.slice(0, 140))); p.on("response", r => { if(r.url().startsWith(url) && r.status() >= 400) s404.push(r.status() + " " + r.url().slice(url.length - 1)); });
        await p.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort()); await p.goto(url); await p.waitForTimeout(1500);
        const r = await p.evaluate(async () => { const load = src => new Promise(res => { const im = new Image(); im.onload = () => res(im.naturalWidth > 0); im.onerror = () => res(false); im.src = src + (/^data:/.test(src) ? "" : "?g=" + Date.now()); });
          const out = { icons: [], imgs: [] }; for(const k of Object.keys(AUTH_ICONS)) if(!(await load(AUTH_ICONS[k]))) out.icons.push(k);
          for(const src of ["images/favicon.svg", "images/vshe-logo.png", "favicon.ico", "apple-touch-icon.png"]) if(!(await load(src))) out.imgs.push(src);
          try { document.getElementById("yd-login")?.remove(); AUTH.user = { provider: "yandex", name: "Пример", avatar: "images/нет-такой.png" }; showTab("auth", false); renderAuth(); } catch(e) { out.authErr = e.message; }
          await new Promise(res => setTimeout(res, 700)); const av = document.querySelector(".au-av"); out.av = av ? (av.querySelector("img") ? "битая картинка осталась" : av.textContent.trim()) : "нет блока";
          out.broken = [...document.images].filter(i => i.complete && !i.naturalWidth && i.getAttribute("src") && i.style.display !== "none" && i.offsetParent).map(i => i.getAttribute("src").slice(0, 60)); return out; });
        const tag = (vw === 390 ? "телефон 390" : "ПК 1300") + ": ";
        if(r.icons.length) fail(tag + "значки входа не рисуются: " + r.icons.join(", "));
        if(r.imgs.length) fail(tag + "картинки не рисуются: " + r.imgs.join(", "));
        if(r.av !== "П") fail(tag + "битый аватар не заменён буквой (" + r.av + ")");
        if(r.broken.length) fail(tag + "видимые битые картинки: " + r.broken.join(", "));
        const real404 = s404.filter(x => !/нет-такой|%D0%BD%D0%B5%D1%82/.test(x)); if(real404.length) fail(tag + "ответы с ошибкой: " + real404.join(", "));
        if(errs.length) fail(tag + "ошибки страницы: " + errs.slice(0, 3).join(" | "));
        if(!r.icons.length && !r.imgs.length && r.av === "П" && !r.broken.length && !real404.length && !errs.length) pass(tag + "значки входа и картинки рисуются, битый аватар заменяется буквой, ошибок и 404 нет");
        await p.close(); }
      await br.close(); srv.close(); } }
  ok.forEach(m => console.log("ok:", m)); bad.forEach(m => console.log("ОШИБКА:", m));
  console.log(bad.length ? "\nВОРОТА НЕ ПРОЙДЕНЫ: " + bad.length : "\nВОРОТА ПРОЙДЕНЫ"); process.exit(bad.length ? 1 : 0);
})();
