import mongoose from 'mongoose';
import { Product, Sku, type ISkuDocument } from '../db/models/index.js';
import { connectDatabase } from '../config/database.js';
import { getConfig } from '../config/env.js';

async function run() {
  try {
    console.log('Connecting to database...');
    await connectDatabase(getConfig());
    console.log('Connected.');

    const products = await Product.find({}).select('_id name');
    console.log(`Found ${products.length} products to migrate.`);

    let updatedCount = 0;

    for (const product of products) {
      const aggregation = await Sku.aggregate([
        {
          $match: {
            productId: product._id,
            isActive: true,
            deletedAt: null,
          },
        },
        {
          $facet: {
            stats: [
              {
                $group: {
                  _id: null,
                  minPrice: { $min: '$pricePaise' },
                  maxPrice: { $max: '$pricePaise' },
                  minMrp: { $min: '$mrpPaise' },
                  maxMrp: { $max: '$mrpPaise' },
                },
              },
            ],
            defaultSku: [
              { $match: { isDefault: true } },
              { $sort: { pricePaise: 1 } },
              { $limit: 1 },
              { $project: { pricePaise: 1, mrpPaise: 1 } },
            ],
          },
        },
      ]);

      const stats = aggregation[0]?.stats[0] || {
        minPrice: 0,
        maxPrice: 0,
        minMrp: 0,
        maxMrp: 0,
      };
      const defaultSku = aggregation[0]?.defaultSku[0];

      const basePrice = defaultSku ? defaultSku.pricePaise : stats.minPrice;
      const baseMrp = defaultSku ? defaultSku.mrpPaise : stats.minMrp;

      await Product.updateOne(
        { _id: product._id },
        {
          $set: {
            basePricePaise: basePrice,
            baseMrpPaise: baseMrp,
            minPricePaise: stats.minPrice,
            maxPricePaise: stats.maxPrice,
            minMrpPaise: stats.minMrp,
            maxMrpPaise: stats.maxMrp,
          },
        }
      );

      updatedCount++;
      if (updatedCount % 10 === 0) {
        console.log(`Migrated ${updatedCount}/${products.length} products...`);
      }
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

run();
