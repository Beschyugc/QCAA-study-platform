-- CreateEnum
CREATE TYPE "ComplexityBand" AS ENUM ('simple_familiar', 'complex_familiar', 'complex_unfamiliar');

-- AlterTable
-- Nullable with no default: existing cards were not authored against a band,
-- and backfilling them to a guessed value would misreport the deck's mix.
ALTER TABLE "Card" ADD COLUMN "complexity" "ComplexityBand";
