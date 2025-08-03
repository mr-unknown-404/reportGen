// generate-pdf.js
import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.post('/generate-pdf', async (req, res) => {
  const { htmlContent } = req.body;

  const fullHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>VAPT Report</title>
    <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet" />
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body { font-family: Arial, sans-serif; padding: 2rem; }
      .page-break { page-break-before: always; }
      .report-section {
        margin-bottom: 2rem;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: auto;
      }
        ul, ol {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}
ul li {
  list-style-type: disc;
}
ol li {
  list-style-type: decimal;
}

    </style>
  </head>
  <body>
    ${htmlContent}
  </body>
  </html>
  `;

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.setContent(fullHtml, { waitUntil: 'domcontentloaded' });

    // 🔧 Wait for all images to load
    await page.evaluate(async () => {
      const selectors = Array.from(document.images);
      await Promise.all(
        selectors.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
            img.onload = img.onerror = resolve;
          });
        })
      );
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '1in', bottom: '1in', left: '0.5in', right: '0.5in' }
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="VAPT-Report.pdf"',
    });

    res.send(pdf);
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).send('PDF generation failed.');
  }
});

app.listen(PORT, () => {
  console.log(`✅ PDF generator server running at http://localhost:${PORT}`);
});
