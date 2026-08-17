// ============================================================================
// RootX — Non-Destructive Liquid Template Preview Processor
// Renders Liquid section templates for live browser previews.
// Accurately evaluates nested control flow ({% if %}, {% for %}, {% unless %}, {% case %})
// without stripping HTML elements or gallery image blocks.
// ============================================================================

export interface LiquidPreviewOptions {
  images?: string[];
  heroImage?: string;
  storyImage?: string;
  featuredImage?: string;
  finalCtaImage?: string;
  comparisonImage?: string;
  headline?: string;
  subheadline?: string;
  brandName?: string;
}

/**
 * Finds the index and length of the matching closing tag for a given opening Liquid tag,
 * properly handling arbitrarily deep tag nesting via stack depth tracking.
 */
function findMatchingTagPair(
  str: string,
  startPos: number,
  openKeyword: string,
  closeKeyword: string
): { openTagEnd: number; closeIndex: number; closeTagLength: number } | null {
  const tagRegex = new RegExp(`({%\\s*(${openKeyword}|${closeKeyword})\\b[\\s\\S]*?%})`, 'gi');
  tagRegex.lastIndex = startPos;

  const firstMatch = tagRegex.exec(str);
  if (!firstMatch || firstMatch.index !== startPos) return null;

  const openTagEnd = startPos + firstMatch[1].length;
  let depth = 1;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(str)) !== null) {
    const fullTag = match[1];
    const keyword = match[2].toLowerCase();

    if (keyword === openKeyword.toLowerCase()) {
      depth++;
    } else if (keyword === closeKeyword.toLowerCase()) {
      depth--;
      if (depth === 0) {
        return {
          openTagEnd,
          closeIndex: match.index,
          closeTagLength: fullTag.length,
        };
      }
    }
  }

  return null;
}

/**
 * Splits an IF block content into primary IF body and optional ELSE body,
 * taking top-level {% else %} at depth 0 into account.
 */
function splitIfElseBranches(blockContent: string): { ifBody: string; elseBody: string | null } {
  const tagRegex = /{%\s*(if|endif|else)\b[\s\S]*?%}/gi;
  let depth = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(blockContent)) !== null) {
    const keyword = match[1].toLowerCase();
    if (keyword === 'if') {
      depth++;
    } else if (keyword === 'endif') {
      depth--;
    } else if (keyword === 'else' && depth === 0) {
      const elseTagEnd = match.index + match[0].length;
      return {
        ifBody: blockContent.slice(0, match.index),
        elseBody: blockContent.slice(elseTagEnd),
      };
    }
  }

  return { ifBody: blockContent, elseBody: null };
}

/**
 * Preview has no Shopify product context. Shopify-native {% if %} branches that
 * depend on product.media / product.images must evaluate false so baked RootX
 * fallback markup (renderAssetImgTag) in {% else %} branches is used instead.
 */
function evaluatePreviewIfCondition(openingTag: string, images: string[]): boolean | null {
  const tag = openingTag.toLowerCase();

  if (/product\.media\.size\s*>\s*0/.test(tag)) return false;
  if (/product\.images\.size\s*>\s*0/.test(tag)) return false;
  if (/media\.media_type\s*==/.test(tag)) return false;

  if (/\bshowcase_media\b/.test(tag) && !/blank/.test(tag)) return false;
  if (/\bstory_media\b/.test(tag) && !/blank/.test(tag)) return false;
  if (/\bmain_left_media\b/.test(tag)) return false;
  if (/\bmain_prod_media\b/.test(tag)) return false;

  if (/thumb_left_count\s*==\s*0/.test(tag)) return true;
  if (/gallery_media_rendered\s*==\s*0/.test(tag)) return true;

  if (/section\.blocks\.size\s*>\s*0/.test(tag)) return images.length > 0;
  if (/block\.settings\.image_url\s*!=\s*blank/.test(tag)) return images.length > 0;

  return null;
}

function isBlockGalleryForLoop(openingTag: string): boolean {
  return /for\s+block\s+in\s+section\.blocks/i.test(openingTag);
}

function isShopifyCatalogForLoop(openingTag: string): boolean {
  return /for\s+(media|image)\s+in\s+product\.(media|images)/i.test(openingTag);
}

/**
 * Recursively processes Liquid control structures ({% if %}, {% for %}, {% unless %}, {% case %})
 */
function processLiquidControlFlow(
  liquidStr: string,
  images: string[],
  heroImage: string,
  options: LiquidPreviewOptions
): string {
  if (!liquidStr) return '';

  let result = liquidStr;
  let iterations = 0;
  const MAX_ITERATIONS = 500;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const tagMatch = result.match(/{%\s*(for|if|unless|case)\b[\s\S]*?%}/i);
    if (!tagMatch) break;

    const startPos = tagMatch.index ?? 0;
    const tagType = tagMatch[1].toLowerCase();

    const openKeyword = tagType;
    const closeKeyword = `end${tagType}`;

    const pair = findMatchingTagPair(result, startPos, openKeyword, closeKeyword);
    if (!pair) {
      result = result.slice(0, startPos) + result.slice(startPos + tagMatch[0].length);
      continue;
    }

    const { openTagEnd, closeIndex, closeTagLength } = pair;
    const openingTag = tagMatch[0];
    const innerContent = result.slice(openTagEnd, closeIndex);

    let replacement = '';

    if (tagType === 'for') {
      if (isShopifyCatalogForLoop(openingTag)) {
        replacement = '';
      } else if (isBlockGalleryForLoop(openingTag)) {
        const loopItems = images.length > 0 ? images : [heroImage || ''];
        const renderedItems: string[] = [];

        loopItems.forEach((imgUrl, idx) => {
          let itemBody = innerContent;

          itemBody = itemBody.replace(
            /{%\s*if\s+forloop\.first\s*%}([\s\S]*?)(?:{%\s*else\s*%}([\s\S]*?))?{%\s*endif\s*%}/gi,
            (_, firstBranch, elseBranch) => (idx === 0 ? firstBranch : elseBranch || '')
          );

          itemBody = itemBody
            .replace(/\{\{\s*forloop\.index\s*\}\}/g, String(idx + 1))
            .replace(/\{\{\s*forloop\.index0\s*\}\}/g, String(idx))
            .replace(/\{\{\s*forloop\.first\s*\}\}/g, String(idx === 0));

          itemBody = itemBody
            .replace(/\{\{\s*block\.settings\.image_url\s*\|\s*asset_url\s*\}\}/g, imgUrl)
            .replace(/\{\{\s*block\.settings\.image_url\s*\}\}/g, imgUrl)
            .replace(/\{\{\s*block\.settings\.image\s*\|\s*asset_url\s*\}\}/g, imgUrl)
            .replace(/\{\{\s*block\.settings\.image\s*\}\}/g, imgUrl)
            .replace(/\{\{\s*image_url\s*\|\s*asset_url\s*\}\}/g, imgUrl)
            .replace(/\{\{\s*image_url\s*\}\}/g, imgUrl);

          itemBody = processLiquidControlFlow(itemBody, images, heroImage, options);
          renderedItems.push(itemBody);
        });

        replacement = renderedItems.join('\n');
      } else {
        replacement = '';
      }
    } else if (tagType === 'if') {
      const { ifBody, elseBody } = splitIfElseBranches(innerContent);
      const previewCondition = evaluatePreviewIfCondition(openingTag, images);

      let conditionIsTrue: boolean;
      if (previewCondition !== null) {
        conditionIsTrue = previewCondition;
      } else {
        conditionIsTrue = false;
      }

      const selectedBranch = conditionIsTrue ? ifBody : elseBody || '';
      replacement = processLiquidControlFlow(selectedBranch, images, heroImage, options);
    } else if (tagType === 'unless') {
      const { ifBody, elseBody } = splitIfElseBranches(innerContent);
      const isBlockSizeCheck = /section\.blocks\.size\s*==\s*0/i.test(openingTag);
      const conditionIsTrue = isBlockSizeCheck ? images.length === 0 : false;
      const selectedBranch = conditionIsTrue ? ifBody : elseBody || '';
      replacement = processLiquidControlFlow(selectedBranch, images, heroImage, options);
    } else if (tagType === 'case') {
      replacement = processLiquidControlFlow(innerContent, images, heroImage, options);
    }

    result = result.slice(0, startPos) + replacement + result.slice(closeIndex + closeTagLength);
  }

  return result;
}

/**
 * Replaces Liquid variable output expressions {{ ... }} with preview values.
 */
function processLiquidVariables(html: string, options: LiquidPreviewOptions): string {
  if (!html) return '';

  const heroUrl = options.heroImage || (options.images && options.images[0]) || '';
  const headline = options.headline || 'Premium Collection';
  const subheadline = options.subheadline || 'Engineered for exceptional daily performance.';
  const brandName = options.brandName || 'Store';

  return html
    .replace(/\{\{\s*section\.settings\.headline\s*\}\}/g, headline)
    .replace(/\{\{\s*section\.settings\.subheadline\s*\}\}/g, subheadline)
    .replace(/\{\{\s*section\.settings\.cta_url\s*\}\}/g, '#')
    .replace(/\{\{\s*product\.title\s*\}\}/g, brandName)
    .replace(/\{\{\s*product\.selected_or_first_available_variant\.id\s*\}\}/g, '1')
    .replace(/\{\{\s*['"]?([^'"]+)['"]?\s*\|\s*asset_url\s*\}\}/g, (_, assetVal) => {
      const cleanVal = assetVal ? assetVal.trim() : '';
      if (cleanVal.startsWith('http://') || cleanVal.startsWith('https://') || cleanVal.startsWith('/cached-images/') || cleanVal.startsWith('data:image/')) {
        return cleanVal;
      }
      const matchIdx = cleanVal.match(/rootx-product-(\d+)/i);
      if (matchIdx && options.images && options.images.length > 0) {
        const num = parseInt(matchIdx[1], 10);
        if (!isNaN(num) && num > 0 && options.images[num - 1]) {
          return options.images[num - 1];
        }
      }
      return heroUrl;
    })
    .replace(/\{\{\s*[\s\S]*?\s*\}\}/g, '')
    .replace(/{%\s*[\s\S]*?%\s*}/g, '');
}

/**
 * Main entry point: Renders a Liquid section template string into clean, fully-rendered HTML for preview.
 */
export function renderLiquidForPreview(liquidContent: string, options: LiquidPreviewOptions = {}): string {
  if (!liquidContent) return '';

  const images = options.images && options.images.length > 0 ? options.images : [];
  const heroImage = options.heroImage || images[0] || '';

  let html = liquidContent.replace(/{%\s*schema\s*%}[\s\S]*?{%\s*endschema\s*%}/gi, '');

  html = processLiquidControlFlow(html, images, heroImage, options);

  html = processLiquidVariables(html, options);

  return html;
}
