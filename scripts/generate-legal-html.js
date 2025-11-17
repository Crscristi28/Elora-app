import fs from 'fs/promises';
import path from 'path';
import MarkdownIt from 'markdown-it';

const baseDir = path.resolve('pravni-dokumentace');

const languageLabels = {
  cs: 'Čeština',
  en: 'English',
  ro: 'Română'
};

const documentMap = [
  {
    key: 'terms',
    names: {
      cs: 'podminky-uzivani',
      en: 'terms-of-use',
      ro: 'terms-of-use'
    }
  },
  {
    key: 'privacy',
    names: {
      cs: 'zasady-ochrany-soukromi',
      en: 'privacy-policy',
      ro: 'privacy-policy'
    }
  },
  {
    key: 'security',
    names: {
      cs: 'autentizace-a-bezpecnost',
      en: 'authentication-and-security',
      ro: 'authentication-and-security'
    }
  },
  {
    key: 'processing',
    names: {
      cs: 'prehled-zpracovani-dat',
      en: 'data-processing-overview',
      ro: 'data-processing-overview'
    }
  },
  {
    key: 'gdpr',
    names: {
      cs: 'gdpr-soulad',
      en: 'gdpr-compliance',
      ro: 'gdpr-compliance'
    }
  },
  {
    key: 'service',
    names: {
      cs: 'popis-sluzby-omnia',
      en: 'service-overview',
      ro: 'service-overview'
    }
  },
  {
    key: 'manifest',
    names: {
      cs: 'omnia-manifest',
      en: 'omnia-manifest',
      ro: 'omnia-manifest'
    }
  }
];

const sources = [
  {
    lang: 'cs',
    srcDir: baseDir,
    filter: (entry) => entry.isFile() && entry.name.endsWith('.md')
  },
  {
    lang: 'en',
    srcDir: path.join(baseDir, 'en'),
    filter: (entry) => entry.isFile() && entry.name.endsWith('.md')
  },
  {
    lang: 'ro',
    srcDir: path.join(baseDir, 'ro'),
    filter: (entry) => entry.isFile() && entry.name.endsWith('.md')
  }
];

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: false
});

function findDocConfig(lang, baseName) {
  return documentMap.find(doc => doc.names[lang] === baseName);
}

function buildLanguageSwitcher(currentLang, baseName) {
  const doc = findDocConfig(currentLang, baseName);
  if (!doc) return '';

  const links = Object.entries(doc.names)
    .filter(([langCode, fileBase]) => fileBase && sources.find(src => src.lang === langCode))
    .map(([langCode, fileBase]) => ({
      langCode,
      label: languageLabels[langCode] || langCode.toUpperCase(),
      href:
        langCode === currentLang
          ? null
          : `../${langCode}/${fileBase}.html`
    }));

  if (links.length <= 1) return '';

  const items = links
    .map(link => {
      if (!link.href) {
        return `<span class="lang-option active">${escapeHtml(link.label)}</span>`;
      }
      return `<a class="lang-option" href="${link.href}">${escapeHtml(link.label)}</a>`;
    })
    .join('');

  return `
  <nav class="language-bar">
    <div class="language-inner">
      <span class="language-label">Language</span>
      <div class="language-options">
        ${items}
      </div>
    </div>
  </nav>`;
}

function extractTitle(content) {
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.startsWith('# ')) {
      return line.replace(/^#\s*/, '').trim();
    }
  }
  return 'Omnia Document';
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function convertSource({ lang, srcDir, filter }) {
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  const destDir = path.join(baseDir, 'html', lang);
  await fs.mkdir(destDir, { recursive: true });

  for (const entry of entries) {
    if (!filter(entry)) continue;

    const srcPath = path.join(srcDir, entry.name);
    const baseName = entry.name.replace(/\.md$/, '');
    const destName = `${baseName}.html`;
    const destPath = path.join(destDir, destName);

    const content = await fs.readFile(srcPath, 'utf8');
    const title = extractTitle(content);
    const body = md.render(content);

    const languageSwitcher = buildLanguageSwitcher(lang, baseName);

    const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; }
    main { max-width: 960px; margin: 0 auto; padding: 2rem 1.5rem 3rem; line-height: 1.6; color: #1a202c; }
    h1, h2, h3 { color: #0f172a; }
    h1 { font-size: 2rem; margin-bottom: 1.5rem; }
    h2 { font-size: 1.5rem; margin-top: 2rem; }
    h3 { font-size: 1.25rem; margin-top: 1.5rem; }
    ul, ol { padding-left: 1.4rem; }
    code { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; background: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 4px; }
    table { border-collapse: collapse; width: 100%; margin: 1.5rem 0; font-size: 0.95rem; }
    th, td { border: 1px solid #cbd5f5; padding: 0.6rem 0.8rem; text-align: left; vertical-align: top; }
    th { background: #f8fafc; font-weight: 600; }
    .language-bar { background: rgba(15, 23, 42, 0.82); padding: 1rem 0; border-bottom: 1px solid rgba(148, 163, 198, 0.18); margin-bottom: 2rem; position: sticky; top: 0; backdrop-filter: blur(14px); z-index: 5; }
    .language-inner { max-width: 960px; margin: 0 auto; display: flex; align-items: center; gap: 1rem; padding: 0 1.5rem; flex-wrap: wrap; }
    .language-label { font-size: 0.9rem; font-weight: 600; color: #38bdf8; letter-spacing: 0.06em; text-transform: uppercase; }
    .language-options { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .language-options a, .language-options span { font-size: 0.95rem; padding: 0.45rem 0.9rem; border-radius: 999px; border: 1px solid rgba(148, 163, 198, 0.3); color: #e2e8f0; text-decoration: none; transition: all 0.2s ease; }
    .language-options a:hover { border-color: rgba(56, 189, 248, 0.6); color: #38bdf8; }
    .language-options .active { background: rgba(56, 189, 248, 0.18); border-color: rgba(56, 189, 248, 0.4); color: #38bdf8; cursor: default; }
    @media (max-width: 640px) { .language-inner { padding: 0 1rem; } }
  </style>
</head>
<body>
  <main class="legal-document">
${languageSwitcher}
${body.trimEnd()}
  </main>
</body>
</html>
`;

    await fs.writeFile(destPath, html, 'utf8');
    console.log(`Generated ${path.relative(process.cwd(), destPath)}`);
  }
}

async function main() {
  for (const source of sources) {
    try {
      await convertSource(source);
    } catch (error) {
      console.error(`Failed to convert documents for ${source.lang}:`, error);
      process.exitCode = 1;
    }
  }
}

await main();
