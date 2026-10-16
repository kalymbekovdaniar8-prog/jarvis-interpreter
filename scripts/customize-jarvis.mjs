import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || 'source');
const file = (rel) => path.join(root, rel);
const read = (rel) => fs.readFileSync(file(rel), 'utf8');
const write = (rel, text) => fs.writeFileSync(file(rel), text, 'utf8');

function replaceExact(rel, before, after, { optional = false } = {}) {
  const current = read(rel);
  if (!current.includes(before)) {
    if (optional) return false;
    throw new Error(`Expected text not found in ${rel}: ${before.slice(0, 120)}`);
  }
  write(rel, current.replace(before, after));
  return true;
}

function replaceRegex(rel, regex, replacement, { optional = false } = {}) {
  const current = read(rel);
  if (!regex.test(current)) {
    if (optional) return false;
    throw new Error(`Expected pattern not found in ${rel}: ${regex}`);
  }
  write(rel, current.replace(regex, replacement));
  return true;
}

console.log(`Customizing pinned Interpreter source at ${root}`);

// Product identity + community/local-only distribution coordinates.
{
  const p = JSON.parse(read('product.json'));
  Object.assign(p, {
    nameShort: 'JARVIS Local',
    nameLong: 'JARVIS Local Agent',
    applicationName: 'jarvis-local',
    dataFolderName: '.jarvis-local',
    win32MutexName: 'jarvis-local',
    win32DirName: 'JARVIS Local',
    win32NameVersion: 'JARVIS Local',
    win32RegValueName: 'JARVIS Local',
    win32AppUserModelId: 'Local.JARVIS',
    win32ShellNameShort: 'J&ARVIS Local',
    urlProtocol: 'jarvis-local',
  });
  p.distribution = p.distribution || {};
  p.distribution.id = 'community';
  p.distribution.hostedApiBaseUrl = '';
  p.distribution.billingApiBaseUrl = '';
  p.distribution.newsletterUrl = '';
  p.distribution.interviewBookingUrl = '';
  p.distribution.auth = { provider: 'none', url: '', anonKey: '', storageKey: 'jarvis-auth-token' };
  p.distribution.telemetry = { sentryDsn: '', eventsUrl: '', eventsAnonKey: '' };
  p.distribution.updates = { provider: 'none', bucket: '', endpoint: '', path: '', internalPath: '', region: '', acl: '' };
  p.configurationDefaults = p.configurationDefaults || {};
  p.configurationDefaults['update.mode'] = 'none';
  p.configurationDefaults['extensions.autoUpdate'] = false;
  p.configurationDefaults['extensions.autoCheckUpdates'] = false;
  write('product.json', `${JSON.stringify(p, null, 2)}\n`);
}

// Package metadata for our unsigned experimental build.
{
  const p = JSON.parse(read('package.json'));
  p.version = '0.3.1';
  p.description = 'JARVIS Local — Russian-first local Windows agent based on Interpreter Workstation';
  write('package.json', `${JSON.stringify(p, null, 2)}\n`);
}

// Force Russian instead of the upstream English fallback.
replaceExact('src/i18n.ts', "  lng: 'en',\n  fallbackLng: 'en',", "  lng: 'ru',\n  fallbackLng: 'ru',");
replaceExact('server/handlers/settings.ts', "  return { language: 'en' };", "  return { language: 'ru' };");
replaceExact('electron/i18n.ts', "  return 'en';", "  return 'ru';");
replaceExact('electron/i18n.ts', "    fallbackLng: 'en',", "    fallbackLng: 'ru',");
replaceExact('electron/i18n.ts', "  return i18next.language ?? 'en';", "  return i18next.language ?? 'ru';");

// Window / installer identity, no document hijacking, per-user install.
{
  let yml = read('electron-builder.yml');
  yml = yml.replace(/^appId:\s*interpreter/m, 'appId: local.jarvis');
  yml = yml.replace(/^productName:\s*Interpreter/m, 'productName: JARVIS Local');
  yml = yml.replace(/(^protocols:\s*\n\s*- name:) Interpreter/m, '$1 JARVIS Local');
  yml = yml.replace(/(^\s+schemes:\s*\n\s+-) interpreter/m, '$1 jarvis-local');
  yml = yml.replace(/\n# Register OS-level file associations[\s\S]*?\nafterPack:/m,
    '\n# JARVIS intentionally does not register DOCX/XLSX/PDF file associations.\nafterPack:');
  yml = yml.replace(/nsis:\s*\n\s*perMachine:\s*true/m,
    'nsis:\n  perMachine: false\n  oneClick: false\n  allowToChangeInstallationDirectory: true\n  createDesktopShortcut: true\n  createStartMenuShortcut: true');
  write('electron-builder.yml', yml);
}

// Browser title.
replaceRegex('index.html', /<title>[^<]*<\/title>/, '<title>JARVIS Local</title>');

// Prefer the already-installed multimodal Qwen model on the user's machine.
replaceExact(
  'src/components/onboarding/screens/localRuntimeOnboarding.ts',
  "const OLLAMA_MODEL_NAMES: Record<string, string> = {\n",
  "const OLLAMA_MODEL_NAMES: Record<string, string> = {\n  'qwen3-vl:8b': 'Qwen3-VL 8B — локально, текст + изображения',\n",
);
replaceExact(
  'src/components/onboarding/screens/localRuntimeOnboarding.ts',
  "    const profiles = selectableModels.map((model) => {",
  "    const preferredOrder = ['qwen3-vl:8b', 'qwen3.5:9b', 'qwen3.5:4b', 'qwen3.5:0.8b'];\n    const orderedModels = [...selectableModels].sort((left, right) => {\n      const li = preferredOrder.indexOf(left.id.toLowerCase());\n      const ri = preferredOrder.indexOf(right.id.toLowerCase());\n      return (li < 0 ? 999 : li) - (ri < 0 ? 999 : ri) || left.displayName.localeCompare(right.displayName);\n    });\n    const profiles = orderedModels.map((model) => {",
);

// Less polling and Russian user-facing Simple-mode fallback strings.
replaceExact('src/components/simple/SimpleInterface.tsx', '    }, 900);', '    }, 2200);');
const simpleInterfaceReplacements = [
  ['aria-label="Interpreter interface"', 'aria-label="Интерфейс JARVIS"'],
  ['title="Interpreter interface"', 'title="Интерфейс JARVIS"'],
  ['"The interface needs a code fix. See interface/.runtime/diagnostics.json."', '"Интерфейс требует исправления. Последняя рабочая версия сохранена."'],
  ['"Compiling your interface…"', '"JARVIS подготавливает рабочее пространство…"'],
  ['The latest interface edit needs fixing. The last working version is\n          still running.', 'Последнее изменение интерфейса требует исправления. Рабочая версия продолжает работать.'],
];
for (const [a, b] of simpleInterfaceReplacements) replaceExact('src/components/simple/SimpleInterface.tsx', a, b, { optional: true });

// Translate the most visible hardcoded labels without rewriting the whole agent UI.
const shellPairs = [
  ['<span>Back</span>', '<span>Назад</span>'],
  ['? "Models"', '? "Модели"'],
  [': "Settings"', ': "Настройки"'],
  ['?? "Update"', '?? "Результат"'],
  [': "Conversation"', ': "Диалог"'],
  ['>Activity details</summary>', '>Подробности работы</summary>'],
  ["{isStreaming ? 'Working' : 'Ready'}", "{isStreaming ? 'Работаю' : 'Готов'}"],
  [' messages in this conversation', ' сообщений в этом диалоге'],
  ['aria-label="Settings"', 'aria-label="Настройки"'],
  ['>Interface<', '>Интерфейс<'],
  ['"Loading…"', '"Загрузка…"'],
  ['>New interface<', '>Новый интерфейс<'],
  ['>Open folder<', '>Открыть папку<'],
];
for (const [a, b] of shellPairs) replaceExact('src/components/simple/SimpleShell.tsx', a, b, { optional: true });

// Lightweight visual layer: no WebGL, video backgrounds or permanent heavy blur.
{
  const rel = 'src/index.css';
  const marker = '/* JARVIS_LOCAL_VISUALS */';
  let css = read(rel);
  if (!css.includes(marker)) {
    css += `\n\n${marker}\n:root {\n  --jarvis-cyan: #62e8ff;\n  --jarvis-violet: #8b7cff;\n  --jarvis-panel: rgba(13, 20, 29, 0.94);\n}\nhtml, body, #root {\n  background: #090e14;\n}\nbody {\n  background-image:\n    radial-gradient(circle at 50% -10%, rgba(98,232,255,.08), transparent 35%),\n    radial-gradient(circle at 85% 20%, rgba(139,124,255,.06), transparent 28%),\n    linear-gradient(180deg, #0b1017 0%, #080c12 100%);\n}\n* { scrollbar-width: thin; scrollbar-color: rgba(120,160,180,.28) transparent; }\n::selection { background: rgba(98,232,255,.24); }\n[data-simple-conversation=\"true\"] {\n  filter: drop-shadow(0 18px 38px rgba(0,0,0,.28));\n}\n[data-simple-conversation=\"true\"] .oa-composer-surface {\n  border-color: rgba(122,214,236,.14) !important;\n  box-shadow: 0 18px 44px rgba(0,0,0,.30), inset 0 1px rgba(255,255,255,.025);\n}\n@media (prefers-reduced-motion: reduce) {\n  *, *::before, *::after { animation-duration: .001ms !important; transition-duration: .001ms !important; }\n}\n`;
    write(rel, css);
  }
}

console.log('JARVIS customization complete.');
