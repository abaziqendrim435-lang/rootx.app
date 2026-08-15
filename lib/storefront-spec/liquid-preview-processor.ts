// ============================================================================
// RootX — Non-Destructive Liquid Template Preview Processor
// Renders Liquid section templates for live browser previews.
// Accurately evaluates nested control flow ({% if %}, {% for %}, {% unless %}, {% case %})
// without stripping HTML elements or gallery image blocks.
// ============================================================================

export interface LiquidPreviewOptions {
  images?: string[];
  heroImage?: string;
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
  // Find top-level {% else %} not inside nested {% if %}
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

    // Find first opening control-flow tag ({% for ... %}, {% if ... %}, etc.)
    const tagMatch = result.match(/{%\s*(for|if|unless|case)\b[\s\S]*?%}/i);
    if (!tagMatch) break;

    const startPos = tagMatch.index ?? 0;
    const tagType = tagMatch[1].toLowerCase();

    let openKeyword = tagType;
    let closeKeyword = `end${tagType}`;

    const pair = findMatchingTagPair(result, startPos, openKeyword, closeKeyword);
    if (!pair) {
      // If unmatched tag, remove just the opening tag to avoid infinite loop
      result = result.slice(0, startPos) + result.slice(startPos + tagMatch[0].length);
      continue;
    }

    const { openTagEnd, closeIndex, closeTagLength } = pair;
    const openingTag = tagMatch[0];
    const innerContent = result.slice(openTagEnd, closeIndex);

    let replacement = '';

    if (tagType === 'for') {
      // Render FOR loop for every image item in N images
      const loopItems = images.length > 0 ? images : [heroImage || ''];
      const renderedItems: string[] = [];

      loopItems.forEach((imgUrl, idx) => {
        let itemBody = innerContent;

        // Process {% if forloop.first %} inside loop item
        itemBody = itemBody.replace(
          /{%\s*if\s+forloop\.first\s*%}([\s\S]*?)(?:{%\s*else\s*%}([\s\S]*?))?{%\s*endif\s*%}/gi,
          (_, firstBranch, elseBranch) => (idx === 0 ? firstBranch : elseBranch || '')
        );

        // Replace forloop variables
        itemBody = itemBody
          .replace(/\{\{\s*forloop\.index\s*\}\}/g, String(idx + 1))
          .replace(/\{\{\s*forloop\.index0\s*\}\}/g, String(idx))
          .replace(/\{\{\s*forloop\.first\s*\}\}/g, String(idx === 0));

        // Replace image URL references
        itemBody = itemBody
          .replace(/\{\{\s*block\.settings\.image_url\s*\|\s*asset_url\s*\}\}/g, imgUrl)
          .replace(/\{\{\s*block\.settings\.image_url\s*\}\}/g, imgUrl)
          .replace(/\{\{\s*block\.settings\.image\s*\|\s*asset_url\s*\}\}/g, imgUrl)
          .replace(/\{\{\s*block\.settings\.image\s*\}\}/g, imgUrl)
          .replace(/\{\{\s*image_url\s*\|\s*asset_url\s*\}\}/g, imgUrl)
          .replace(/\{\{\s*image_url\s*\}\}/g, imgUrl);

        // Recursively process nested control flow inside loop item
        itemBody = processLiquidControlFlow(itemBody, images, heroImage, options);
        renderedItems.push(itemBody);
      });

      replacement = renderedItems.join('\n');
    } else if (tagType === 'if') {
      const { ifBody, elseBody } = splitIfElseBranches(innerContent);
      const isBlockSizeCheck = /section\.blocks\.size\s*>\s*0/i.test(openingTag);
      const isBlankCheck = /image_url\s*!=\s*blank/i.test(openingTag);

      let conditionIsTrue = true;
      if (isBlockSizeCheck) {
        conditionIsTrue = images.length > 0;
      } else if (isBlankCheck) {
        conditionIsTrue = images.length > 0;
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
    .replace(/\{\{\s*[\w.-]+\s*\|\s*asset_url\s*\}\}/g, (match) => {
      // Extract raw path inside filter if available
      const pathMatch = match.match(/\{\{\s*['"]?([^'"]+)['"]?\s*\|\s*asset_url\s*\}\}/);
      return pathMatch ? pathMatch[1] : heroUrl;
    })
    .replace(/\{\{\s*[\s\S]*?\s*\}\}/g, '') // strip remaining unparsed Liquid output tags
    .replace(/{%\s*[\s\S]*?%\s*}/g, ''); // strip remaining unparsed standalone Liquid tags
}

/**
 * Main entry point: Renders a Liquid section template string into clean, fully-rendered HTML for preview.
 */
export function renderLiquidForPreview(liquidContent: string, options: LiquidPreviewOptions = {}): string {
  if (!liquidContent) return '';

  const images = options.images && options.images.length > 0 ? options.images : [];
  const heroImage = options.heroImage || images[0] || '';

  // 1. Remove {% schema %} ... {% endschema %}
  let html = liquidContent.replace(/{%\s*schema\s*%}[\s\S]*?{%\s*endschema\s*%}/gi, '');

  // 2. Process control structures ({% if %}, {% for %}, etc.)
  html = processLiquidControlFlow(html, images, heroImage, options);

  // 3. Replace variable tags {{ ... }}
  html = processLiquidVariables(html, options);

  return html;
}
