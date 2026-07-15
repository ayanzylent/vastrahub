/**
 * Recalculate Product.totalStock (and price aggregates) from active SKUs.
 *
 * Needed when stock was changed via findOneAndUpdate/$inc (inventory commits,
 * restores) which bypasses the Sku post-save hook that normally refreshes
 * Product.totalStock — leaving the admin products table showing stale stock.
 *
 * Usage (from apps/server):
 *   npx tsx --env-file=.env src/scripts/recalculate-product-stock.ts
 *   npx tsx --env-file=.env src/scripts/recalculate-product-stock.ts --apply
 *
 * Dry-run is the default. Pass --apply to write changes.
 */

import { Product, Sku } from '../db/models/index.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { getConfig } from '../config/env.js';
import { recalculateProductAggregates } from '../modules/sku/sku.service.js';

function parseArgs(argv: string[]) {
  return { apply: argv.includes('--apply') };
}

async function run() {
  const { apply } = parseArgs(process.argv.slice(2));

  await connectDatabase(getConfig());
  console.log(apply ? 'Mode: APPLY' : 'Mode: DRY-RUN (pass --apply to write)');

  const products = await Product.find({ deletedAt: null })
    .select('_id name totalStock skuCount')
    .lean();

  console.log(`Found ${products.length} products.`);

  let mismatched = 0;
  let updated = 0;

  for (const product of products) {
    const before = product.totalStock ?? 0;

    const [stats] = await Sku.aggregate<{ totalStock: number; count: number }>([
      {
        $match: {
          productId: product._id,
          isActive: true,
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: null,
          totalStock: { $sum: '$stockQuantity' },
          count: { $sum: 1 },
        },
      },
    ]);

    const actualStock = stats?.totalStock ?? 0;
    const actualSkuCount = stats?.count ?? 0;

    if (before !== actualStock || (product.skuCount ?? 0) !== actualSkuCount) {
      mismatched += 1;
      console.log(
        `  mismatch ${product.name}: totalStock ${before} → ${actualStock}, skuCount ${product.skuCount ?? 0} → ${actualSkuCount}`,
      );

      if (apply) {
        await recalculateProductAggregates(product._id);
        updated += 1;
      }
    }
  }

  console.log(
    apply
      ? `Done. Updated ${updated}/${mismatched} mismatched products.`
      : `Done. ${mismatched} mismatched (re-run with --apply to fix).`,
  );

  await disconnectDatabase();
}

run().catch(async (err) => {
  console.error(err);
  try {
    await disconnectDatabase();
  } catch {
    // ignore
  }
  process.exit(1);
});
