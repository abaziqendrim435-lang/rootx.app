import { NextRequest, NextResponse } from 'next/server';
import { generateShopifyTheme } from '@/lib/shopify-theme-generator';
import JSZip from 'jszip';

// ============================================================
// POST /api/shopify/export-zip
//
// Generates a complete Shopify Online Store 2.0 theme ZIP,
// validates all required files, checks JSON & Liquid schemas,
// and streams it to the browser.
// ============================================================

const REQUIRED_FILES = [
  'layout/theme.liquid',
  'templates/index.json',
  'templates/product.json',
  'templates/collection.json',
  'templates/page.json',
  'templates/cart.json',
  'sections/header.liquid',
  'sections/footer.liquid',
  'sections/hero-product.liquid',
  'sections/product-gallery.liquid',
  'sections/product-benefits.liquid',
  'sections/product-specifications.liquid',
  'sections/faq.liquid',
  'sections/image-with-text.liquid',
  'sections/featured-product.liquid',
  'assets/theme.css',
  'assets/theme.js',
  'config/settings_schema.json',
  'config/settings_data.json',
  'locales/en.default.json',
];

export async function POST(req: NextRequest) {
  try {
    const { result, input } = await req.json();

    if (!result || !input) {
      return NextResponse.json(
        { error: 'Missing generation result or input configuration.' },
        { status: 400 }
      );
    }

    // 1. Generate the theme files
    const files = generateShopifyTheme(result, input);
    const fileMap = new Map<string, string>();
    for (const f of files) {
      fileMap.set(f.key, f.value);
    }

    // 2. Validate all required files exist
    const missingFiles: string[] = [];
    for (const reqFile of REQUIRED_FILES) {
      if (!fileMap.has(reqFile)) {
        missingFiles.push(reqFile);
      }
    }
    if (missingFiles.length > 0) {
      return NextResponse.json(
        { error: `Validation Failed: Missing required theme files: ${missingFiles.join(', ')}` },
        { status: 400 }
      );
    }

    // 2.5 Validate file contents (reject empty files and credentials)
    for (const [key, val] of fileMap.entries()) {
      if (!val || val.trim() === '') {
        return NextResponse.json(
          { error: `Validation Failed: File ${key} is empty.` },
          { status: 400 }
        );
      }

      const secretPatterns = [
        /sk_(live|test)_[a-zA-Z0-9]{24,}/,             // Stripe Secret Key
        /sk-[a-zA-Z0-9]{32,}/,                          // OpenAI API Key
        /AIza[0-9A-Za-z-_]{35}/,                        // Google API Key
        /xox[bpa]-[0-9]{12}-[0-9]{12}-[a-zA-Z0-9]{24}/, // Slack Token
        /ghp_[a-zA-Z0-9]{36}/,                          // GitHub token
        /process\.env\.[a-zA-Z0-9_]+/i,                 // Node environment variables
        /env\.[A-Z_]+/                                  // Environment variable references
      ];

      for (const pattern of secretPatterns) {
        if (pattern.test(val)) {
          return NextResponse.json(
            { error: `Validation Failed: Sensitive information or environment variable reference detected in file ${key}.` },
            { status: 400 }
          );
        }
      }
    }

    // 3. Validate JSON file integrity
    for (const [key, val] of fileMap.entries()) {
      if (key.endsWith('.json')) {
        try {
          JSON.parse(val);
        } catch (err) {
          return NextResponse.json(
            { error: `Validation Failed: Invalid JSON syntax in file ${key}. Details: ${err instanceof Error ? err.message : 'Syntax Error'}` },
            { status: 400 }
          );
        }
      }
    }

    // 4. Validate Liquid tags and Schema blocks
    for (const [key, val] of fileMap.entries()) {
      if (key.endsWith('.liquid')) {
        // Validate matching delimiters
        const openTags = (val.match(/{%/g) || []).length;
        const closeTags = (val.match(/%}/g) || []).length;
        if (openTags !== closeTags) {
          return NextResponse.json(
            { error: `Validation Failed: Mismatched Liquid tag delimiters {% and %} in ${key}` },
            { status: 400 }
          );
        }

        const openOutputs = (val.match(/{{/g) || []).length;
        const closeOutputs = (val.match(/}}/g) || []).length;
        if (openOutputs !== closeOutputs) {
          return NextResponse.json(
            { error: `Validation Failed: Mismatched Liquid output delimiters {{ and }} in ${key}` },
            { status: 400 }
          );
        }

        // Validate Schema block is valid JSON and contains required properties
        if (key.startsWith('sections/')) {
          const schemaMatch = val.match(/{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/);
          if (!schemaMatch) {
            return NextResponse.json(
              { error: `Validation Failed: Section file ${key} is missing a {% schema %} block.` },
              { status: 400 }
            );
          }
          const schemaText = schemaMatch[1].trim();
          try {
            const schemaObj = JSON.parse(schemaText);
            if (!schemaObj.name || schemaObj.name.trim() === '') {
              return NextResponse.json(
                { error: `Validation Failed: Schema inside ${key} is missing the required "name" property.` },
                { status: 400 }
              );
            }
          } catch (err) {
            return NextResponse.json(
              { error: `Validation Failed: Invalid JSON inside {% schema %} block of ${key}. Details: ${err instanceof Error ? err.message : 'Syntax Error'}` },
              { status: 400 }
            );
          }
        }
      }
    }

    // 5. Validate JSON templates and check that all referenced sections exist
    for (const [key, val] of fileMap.entries()) {
      if (key.startsWith('templates/') && key.endsWith('.json')) {
        let templateJson;
        try {
          templateJson = JSON.parse(val);
        } catch {
          continue; // Handled by standard JSON parser check in step 3
        }

        if (templateJson.sections) {
          for (const sectionId of Object.keys(templateJson.sections)) {
            const section = templateJson.sections[sectionId];
            if (section && section.type) {
              const sectionFileName = `sections/${section.type}.liquid`;
              if (!fileMap.has(sectionFileName)) {
                return NextResponse.json(
                  { error: `Validation Failed: JSON template '${key}' references section type '${section.type}', but section file '${sectionFileName}' does not exist in the theme.` },
                  { status: 400 }
                );
              }
            }
          }
        }
      }
    }

    // 5.5 Validate image URLs and settings are present in sections
    const indexJsonStr = fileMap.get('templates/index.json');
    if (indexJsonStr) {
      const indexJson = JSON.parse(indexJsonStr);
      if (!indexJson.sections || Object.keys(indexJson.sections).length === 0) {
        return NextResponse.json(
          { error: 'Validation Failed: index.json has no sections configured.' },
          { status: 400 }
        );
      }
    }

    const heroProductLiquid = fileMap.get('sections/hero-product.liquid');
    if (heroProductLiquid) {
      const schemaMatch = heroProductLiquid.match(/{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/);
      if (schemaMatch) {
        const schema = JSON.parse(schemaMatch[1].trim());
        const imageSettings = schema.settings.filter((s: any) => s.id.includes('image'));
        for (const s of imageSettings) {
          if (!s.default || s.default === '') {
            console.warn(`[ZIP Export] Section setting ${s.id} has an empty image URL.`);
          }
        }
      }
    }

    // 6. Generate the ZIP file using JSZip
    const zip = new JSZip();
    for (const [key, val] of fileMap.entries()) {
      zip.file(key, val);
    }

    // Generate the zip buffer
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

    // 7. Return the ZIP file response
    const filename = `rootx-shopify-theme-${(input.businessName || 'shopify-theme')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase()}.zip`;

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: unknown) {
    console.error('[/api/shopify/export-zip]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate Shopify theme ZIP.' },
      { status: 500 }
    );
  }
}
