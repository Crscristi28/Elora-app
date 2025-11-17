// 📄 PDF Generation API - Markdown to PDF with Puppeteer
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import MarkdownIt from 'markdown-it';

// Initialize markdown parser
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { title, content, documentType = 'document' } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    console.log('📄 [PDF] Generating PDF:', { title, type: documentType });

    // Convert Markdown to HTML
    const htmlContent = md.render(content);
    const fullHTML = generateHTMLDocument(title, htmlContent, documentType);

    // Generate PDF using Puppeteer
    let browser = null;
    try {
      // Launch browser (local or Vercel)
      const isProduction = process.env.NODE_ENV === 'production';

      if (isProduction) {
        // Vercel production
        console.log('🚀 [PDF] Launching Puppeteer on Vercel...');
        console.log('🔧 [PDF] Chromium args:', chromium.args);

        const execPath = await chromium.executablePath();
        console.log('📂 [PDF] Chromium executable path:', execPath);

        browser = await puppeteer.launch({
          args: [
            ...chromium.args,
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-dev-shm-usage',
            '--single-process',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
          ],
          defaultViewport: chromium.defaultViewport,
          executablePath: execPath,
          headless: chromium.headless,
          ignoreHTTPSErrors: true,
          timeout: 30000, // 30 second timeout
        });
        console.log('✅ [PDF] Browser launched successfully on Vercel');
      } else {
        // Local development - try to find Chrome executable
        const possiblePaths = [
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // macOS
          '/usr/bin/google-chrome', // Linux
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Windows
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe' // Windows 32-bit
        ];

        let executablePath = null;
        for (const path of possiblePaths) {
          try {
            if (require('fs').existsSync(path)) {
              executablePath = path;
              break;
            }
          } catch (e) {
            // Continue trying
          }
        }

        browser = await puppeteer.launch({
          headless: true,
          executablePath: executablePath || undefined,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
      }

      console.log('📄 [PDF] Creating new page...');
      const page = await browser.newPage();

      // Set shorter timeout for page operations on Vercel
      page.setDefaultTimeout(isProduction ? 15000 : 30000);

      console.log('📝 [PDF] Setting HTML content...');
      await page.setContent(fullHTML, {
        waitUntil: 'networkidle0',
        timeout: isProduction ? 10000 : 30000
      });

      console.log('🖨️ [PDF] Generating PDF buffer...');
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: false,
        margin: {
          top: '2cm',
          right: '2cm',
          bottom: '2cm',
          left: '2cm'
        },
        timeout: isProduction ? 15000 : 30000
      });
      console.log('✅ [PDF] PDF buffer generated, size:', pdfBuffer.length);

      await browser.close();

      // Set PDF headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`);

      console.log('✅ [PDF] Generated successfully:', title);
      return res.status(200).end(pdfBuffer);

    } catch (puppeteerError) {
      if (browser) await browser.close();

      // Detailed error logging for debugging
      console.error('❌ [PDF] Puppeteer error details:', {
        message: puppeteerError.message,
        stack: puppeteerError.stack,
        name: puppeteerError.name,
        isProduction: process.env.NODE_ENV === 'production',
        runtime: process.env.VERCEL ? 'vercel' : 'local'
      });

      // Fallback: return HTML for client-side generation
      return res.status(200).json({
        success: true,
        title,
        html: fullHTML,
        message: `PDF content generated (HTML fallback due to: ${puppeteerError.message})`,
        type: 'html',
        fallback: true,
        error: puppeteerError.message
      });
    }

  } catch (error) {
    console.error('❌ [PDF] Generation error:', error);
    return res.status(500).json({
      error: 'PDF generation failed',
      message: error.message
    });
  }
}

function generateHTMLDocument(title, htmlContent, type) {
  // htmlContent is already processed by markdown-it

  // Different styles based on document type
  const styles = getStylesForType(type);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    ${styles}
  </style>
</head>
<body>
  <div class="document">
    <header>
      <h1>${title}</h1>
      <div class="meta">Generated on ${new Date().toLocaleDateString()}</div>
    </header>
    <main>
      ${htmlContent}
    </main>
  </div>
</body>
</html>`;
}

function getStylesForType(type) {
  const baseStyles = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      background: #fff;
    }

    .document {
      width: 100%;
      margin: 0;
      padding: 0;
    }

    header {
      margin-bottom: 30px;
      padding-bottom: 15px;
      text-align: center;
    }

    header h1 {
      font-size: 18pt;
      font-weight: bold;
      color: #000;
      margin-bottom: 10px;
    }

    .meta {
      font-size: 10pt;
      color: #000;
    }

    main {
      margin-bottom: 30px;
    }

    h1 { font-size: 16pt; font-weight: bold; margin: 20px 0 10px 0; color: #000; }
    h2 { font-size: 14pt; font-weight: bold; margin: 18px 0 8px 0; color: #000; }
    h3 { font-size: 13pt; font-weight: bold; margin: 16px 0 6px 0; color: #000; }
    h4 { font-size: 12pt; font-weight: bold; margin: 14px 0 6px 0; color: #000; }
    h5 { font-size: 12pt; font-weight: bold; margin: 12px 0 4px 0; color: #000; }
    h6 { font-size: 12pt; font-weight: bold; margin: 10px 0 4px 0; color: #000; }

    p {
      margin-bottom: 12px;
      text-align: justify;
    }

    ul, ol {
      margin: 12px 0;
      padding-left: 20px;
    }

    li {
      margin-bottom: 6px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }

    th, td {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
      font-size: 11pt;
    }

    th {
      background: #f5f5f5;
      font-weight: bold;
    }

    strong, b {
      font-weight: bold;
      color: #000;
    }

    em, i {
      font-style: italic;
    }

    code {
      font-family: 'Courier New', monospace;
      font-size: 10pt;
      background: #f5f5f5;
      padding: 2px 4px;
      border: 1px solid #ddd;
    }

    pre {
      font-family: 'Courier New', monospace;
      font-size: 10pt;
      background: #f5f5f5;
      padding: 10px;
      border: 1px solid #ddd;
      margin: 12px 0;
      white-space: pre-wrap;
    }

    blockquote {
      margin: 12px 0;
      padding-left: 15px;
      border-left: 3px solid #000;
      font-style: italic;
    }

    /* Page break rules */
    h1, h2, h3, h4, h5, h6 {
      page-break-after: avoid;
      page-break-inside: avoid;
    }

    table {
      page-break-inside: avoid;
    }

    tr {
      page-break-inside: avoid;
    }

    img {
      max-width: 100%;
      height: auto;
      page-break-inside: avoid;
    }
  `;

  // Add specific styles based on document type
  const typeStyles = {
    report: `
      header h1 {
        font-size: 32px;
        text-align: center;
      }

      h2 {
        font-size: 24px;
        border-bottom: 1px solid #e0e0e0;
        padding-bottom: 8px;
      }
    `,
    invoice: `
      header {
        display: flex;
        justify-content: space-between;
        align-items: start;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }

      th, td {
        padding: 10px;
        text-align: left;
        border-bottom: 1px solid #e0e0e0;
      }

      th {
        background: #f5f5f5;
        font-weight: 600;
      }
    `,
    cv: `
      header h1 {
        font-size: 28px;
        margin-bottom: 5px;
      }

      .section {
        margin-bottom: 30px;
      }

      h2 {
        font-size: 18px;
        color: #3498db;
        border-bottom: 2px solid #3498db;
        padding-bottom: 5px;
        margin-bottom: 15px;
      }
    `,
    document: ''
  };

  return baseStyles + (typeStyles[type] || typeStyles.document);
}