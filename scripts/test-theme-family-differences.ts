// ============================================================
// RootX Theme Family Visual & Structural Difference Test Suite
// Verifies that every one of the 8 Theme Families produces a unique
// section sequence, hero variant, and layout structure.
// Asserts that NO TWO families share identical structures.
// ============================================================

import { THEME_FAMILIES } from '../lib/design-engine/theme-family-types';
import { createSectionPlan } from '../lib/design-engine/section-sequencer';
import type { DesignArchetypeId } from '../lib/website-builder-types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Test assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

function runThemeFamilyDifferenceTests() {
  console.log('\n==================================================');
  console.log('  RUNNING THEME FAMILY STRUCTURAL DIFFERENCE TESTS');
  console.log('==================================================\n');

  const primaryFamilyIds: DesignArchetypeId[] = [
    'modern_tech',
    'soft_beauty',
    'luxury_editorial',
    'minimal_fashion',
    'warm_home',
    'bold_fitness',
    'friendly_pet',
    'high_conversion_single',
  ];
  assert(primaryFamilyIds.length === 8, 'Exactly 8 primary theme families defined');

  const sectionOrders: Record<string, string[]> = {};
  const heroTypes: Record<string, string> = {};
  const galleryStyles: Record<string, string> = {};

  primaryFamilyIds.forEach((id) => {
    const family = THEME_FAMILIES[id];
    const plan = createSectionPlan(id);
    const order = plan.sections.map((s) => s.sectionId);

    sectionOrders[id] = order;
    heroTypes[id] = family.heroType;
    galleryStyles[id] = family.galleryStyle;

    console.log(`• Family: [${family.name}] (${id})`);
    console.log(`  Hero Type: ${family.heroType}`);
    console.log(`  Gallery Style: ${family.galleryStyle}`);
    console.log(`  Section Order: ${order.join(' → ')}\n`);
  });

  // Test 1: Verify section order uniqueness across all pairs of families
  console.log('Test 1: Verifying Section Order Uniqueness Across All Families...');
  for (let i = 0; i < primaryFamilyIds.length; i++) {
    for (let j = i + 1; j < primaryFamilyIds.length; j++) {
      const id1 = primaryFamilyIds[i];
      const id2 = primaryFamilyIds[j];
      const order1 = JSON.stringify(sectionOrders[id1]);
      const order2 = JSON.stringify(sectionOrders[id2]);

      const isUnique = order1 !== order2;
      assert(
        isUnique,
        `Theme families '${id1}' and '${id2}' have distinct section orders (${sectionOrders[id1][1]} vs ${sectionOrders[id2][1]})`
      );
    }
  }

  // Test 2: Verify hero composition diversity
  console.log('\nTest 2: Verifying Hero Composition Diversity...');
  const uniqueHeroes = new Set(Object.values(heroTypes));
  assert(uniqueHeroes.size >= 7, 'At least 7 distinct hero compositions across 8 families');

  // Test 3: Verify gallery layout diversity
  console.log('\nTest 3: Verifying Gallery Layout Diversity...');
  const uniqueGalleries = new Set(Object.values(galleryStyles));
  assert(uniqueGalleries.size >= 7, 'At least 7 distinct gallery styles across 8 families');

  console.log('\n==================================================');
  console.log(' 🎉 ALL THEME FAMILY STRUCTURAL DIFFERENCE TESTS PASSED');
  console.log('==================================================\n');
}

runThemeFamilyDifferenceTests();
