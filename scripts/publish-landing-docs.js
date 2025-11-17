import fs from 'fs/promises';
import path from 'path';

const baseHtmlDir = path.resolve('pravni-dokumentace/html');
const landingDir = path.resolve('omnia-landing');

const documents = [
  'authentication-and-security',
  'data-processing-overview',
  'gdpr-compliance',
  'service-overview',
  'omnia-manifest'
];

const sourceFileNames = {
  'authentication-and-security': {
    en: 'authentication-and-security',
    cs: 'autentizace-a-bezpecnost',
    ro: 'authentication-and-security'
  },
  'data-processing-overview': {
    en: 'data-processing-overview',
    cs: 'prehled-zpracovani-dat',
    ro: 'data-processing-overview'
  },
  'gdpr-compliance': {
    en: 'gdpr-compliance',
    cs: 'gdpr-soulad',
    ro: 'gdpr-compliance'
  },
  'service-overview': {
    en: 'service-overview',
    cs: 'popis-sluzby-omnia',
    ro: 'service-overview'
  },
  'omnia-manifest': {
    en: 'omnia-manifest',
    cs: 'omnia-manifest',
    ro: 'omnia-manifest'
  }
};

const languages = {
  en: {
    suffix: '',
    languageLabel: 'Language',
    cta: 'Try Omnia now',
    brand: 'Omnia One AI',
    langName: 'English'
  },
  cs: {
    suffix: '-cs',
    languageLabel: 'Jazyk',
    cta: 'Vyzkoušet Omnia',
    brand: 'Omnia One AI',
    langName: 'Čeština'
  },
  ro: {
    suffix: '-ro',
    languageLabel: 'Limba',
    cta: 'Încearcă Omnia',
    brand: 'Omnia One AI',
    langName: 'Română'
  }
};

function buildLanguageBar(docKey, currentLang) {
  const current = languages[currentLang];
  const options = Object.entries(languages)
    .map(([lang, config]) => {
      const fileName = `${docKey}${config.suffix}.html`;
      if (lang === currentLang) {
        return `<span class="active">${config.langName}</span>`;
      }
      return `<a href="${fileName}">${config.langName}</a>`;
    })
    .join('');

  return `
      <div class="language-bar">
        <span class="language-label">${current.languageLabel}</span>
        <div class="language-options">
          ${options}
        </div>
      </div>`;
}

function getDocumentTitle(html) {
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!match) return 'Omnia Document';
  return match[1].replace(/<[^>]+>/g, '').trim();
}

function buildShell(docKey, lang, bodyContent, documentTitle) {
  const config = languages[lang];
  return `<!DOCTYPE html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${documentTitle}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="css/styles.css" />
    <style>
      :root {
        --legal-bg: #fffdf8;
        --legal-card: #ffffff;
        --legal-text: #1f2937;
        --legal-muted: #4b5563;
        --legal-accent: #f97316;
        --legal-border: rgba(15, 23, 42, 0.08);
      }
      body {
        margin: 0;
        font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: var(--legal-bg);
        color: var(--legal-text);
      }
      a {
        color: var(--legal-accent);
      }
      .legal-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 18px clamp(18px, 6vw, 120px);
        background: rgba(255, 255, 255, 0.95);
        border-bottom: 1px solid var(--legal-border);
        position: sticky;
        top: 0;
        z-index: 20;
        backdrop-filter: blur(16px);
      }
      .legal-brand {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        font-weight: 700;
        font-size: 20px;
        color: var(--legal-text);
        text-decoration: none;
      }
      .legal-brand-icon {
        width: 40px;
        height: 40px;
        border-radius: 14px;
        background: linear-gradient(135deg, #f97316, #fb923c);
        display: grid;
        place-items: center;
        color: #fff;
        font-size: 20px;
        box-shadow: 0 16px 30px rgba(249, 115, 22, 0.3);
      }
      .legal-nav a.cta {
        padding: 10px 18px;
        border-radius: 999px;
        border: 1px solid rgba(249, 115, 22, 0.25);
        color: var(--legal-accent);
        text-decoration: none;
        font-weight: 600;
        background: rgba(249, 115, 22, 0.08);
      }
      main {
        max-width: 960px;
        margin: 0 auto;
        padding: clamp(40px, 6vw, 80px) clamp(18px, 6vw, 48px);
        line-height: 1.65;
      }
      .language-bar {
        background: rgba(249, 115, 22, 0.12);
        border: 1px solid rgba(249, 115, 22, 0.22);
        border-radius: 14px;
        padding: 14px 18px;
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
        align-items: center;
        margin-bottom: 28px;
      }
      .language-label {
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--legal-accent);
        font-size: 0.85rem;
      }
      .language-options {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      .language-options a,
      .language-options span {
        padding: 8px 14px;
        border-radius: 999px;
        border: 1px solid rgba(15, 23, 42, 0.08);
        color: var(--legal-muted);
        text-decoration: none;
        font-size: 0.95rem;
        background: #fff;
      }
      .language-options a:hover {
        border-color: rgba(249, 115, 22, 0.4);
        color: var(--legal-accent);
      }
      .language-options .active {
        background: linear-gradient(135deg, #f97316, #fb923c);
        border-color: transparent;
        color: #fff;
        cursor: default;
      }
      h1,
      h2,
      h3 {
        color: var(--legal-text);
      }
      h1 {
        font-size: clamp(30px, 5vw, 40px);
        margin-bottom: 20px;
      }
      h2 {
        font-size: clamp(22px, 3vw, 26px);
        margin-top: 34px;
      }
      h3 {
        font-size: 20px;
        margin-top: 24px;
      }
      p {
        color: var(--legal-muted);
        margin: 0 0 16px;
      }
      ul,
      ol {
        padding-left: 22px;
        color: var(--legal-muted);
        margin: 0 0 18px;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        margin: 24px 0;
        font-size: 0.95rem;
      }
      th,
      td {
        border: 1px solid rgba(15, 23, 42, 0.08);
        padding: 12px;
        text-align: left;
        vertical-align: top;
      }
      th {
        background: rgba(249, 115, 22, 0.08);
        font-weight: 600;
      }
      @media (max-width: 640px) {
        .legal-nav {
          flex-direction: column;
          gap: 12px;
        }
        .language-bar {
          justify-content: center;
        }
      }
    </style>
  </head>
  <body>
    <nav class="legal-nav">
      <a class="legal-brand" href="omnia-website.html">
        <span class="legal-brand-icon">O</span>
        <span>${config.brand}</span>
      </a>
      <a class="cta" href="https://app.omniaoneai.com" target="_blank" rel="noopener">${config.cta}</a>
    </nav>

    <main>
${buildLanguageBar(docKey, lang)}
${bodyContent.trim()}
    </main>
  </body>
</html>
`;
}

async function extractBodyContent(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  const match = raw.match(/<\/nav>([\s\S]*)<\/main>/);
  if (!match) {
    return raw;
  }
  return match[1];
}

async function publishDocs() {
  for (const docKey of documents) {
    for (const [lang, config] of Object.entries(languages)) {
      const fileStem = sourceFileNames[docKey][lang];
      if (!fileStem) continue;
      const sourcePath = path.join(baseHtmlDir, lang, `${fileStem}.html`);
      const body = await extractBodyContent(sourcePath);
      const title = getDocumentTitle(body);
      const html = buildShell(docKey, lang, body, title);
      const outputPath = path.join(landingDir, `${docKey}${config.suffix}.html`);
      await fs.writeFile(outputPath, html, 'utf8');
      console.log(`Published ${path.relative(process.cwd(), outputPath)}`);
    }
  }
}

publishDocs().catch(error => {
  console.error('Failed to publish landing docs:', error);
  process.exit(1);
});
