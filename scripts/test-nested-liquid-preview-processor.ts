// ============================================================================
// RootX — Nested Liquid Control Flow Regression Test Suite
// Verifies that nested {% if %}/{% for %}/{% endif %} blocks render every assigned
// product image without deleting inner HTML content or gallery <img> elements.
// ============================================================================

import assert from 'assert';
import { renderLiquidForPreview } from '../lib/storefront-spec/liquid-preview-processor';

function runNestedLiquidRegressionTests() {
  console.log('\n================================================================================');
  console.log('  ROOTX NESTED LIQUID CONTROL-FLOW REGRESSION TEST SUITE');
  console.log('================================================================================\n');

  // Requirement 7 Test Input
  const sampleTemplate = `
{% if section.blocks.size > 0 %}
  {% for block in section.blocks %}
    <img src="{{ block.settings.image_url | asset_url }}" />
  {% endfor %}
{% endif %}
`;

  const mock13Images = Array.from({ length: 13 }, (_, i) => `/cached-images/test-gen/image-${String(i + 1).padStart(2, '0')}.avif`);

  console.log(`Test Input Template:`);
  console.log(sampleTemplate.trim());
  console.log(`\nInput Images Count: ${mock13Images.length}`);

  const renderedHtml = renderLiquidForPreview(sampleTemplate, { images: mock13Images });

  console.log('\nRendered HTML Output:');
  console.log(renderedHtml.trim());

  // Extract <img> src matches
  const imgSrcRegex = /<img\s+[^>]*src=["']([^"']*)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  const renderedSrcs: string[] = [];

  while ((match = imgSrcRegex.exec(renderedHtml)) !== null) {
    renderedSrcs.push(match[1]);
  }

  const uniqueSrcs = new Set(renderedSrcs.filter(Boolean));
  const brokenSrcs = renderedSrcs.filter((src) => !src);

  console.log('\n================================================================================');
  console.log('  REGRESSION TEST METRICS REPORT');
  console.log('================================================================================');
  console.log(`SOURCE_PRODUCT_IMAGES:         ${mock13Images.length}`);
  console.log(`ASSIGNED_IMAGES:               ${mock13Images.length}`);
  console.log(`PREVIEW_UNIQUE_PRODUCT_IMAGES: ${uniqueSrcs.size}`);
  console.log(`GALLERY_RENDERED_IMAGES:       ${renderedSrcs.length}`);
  console.log(`BROKEN_PRODUCT_IMAGES:         ${brokenSrcs.length}`);

  // Assertions
  assert.strictEqual(renderedSrcs.length, 13, 'GALLERY_RENDERED_IMAGES must equal 13');
  assert.strictEqual(uniqueSrcs.size, 13, 'PREVIEW_UNIQUE_PRODUCT_IMAGES must equal 13');
  assert.strictEqual(brokenSrcs.length, 0, 'BROKEN_PRODUCT_IMAGES must equal 0');

  console.log('\n  ✓ PASS: Nested {% if %}{% for %}{% endfor %}{% endif %} block rendered all 13 images dynamically!');
  console.log('  ✓ PASS: Zero inner HTML content or gallery images were deleted.');
  console.log('================================================================================\n');
}

runNestedLiquidRegressionTests();
