-- CreateTable
CREATE TABLE "AppAuth" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "salt" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppAuth_pkey" PRIMARY KEY ("id")
);
