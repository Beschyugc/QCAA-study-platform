-- CreateIndex
CREATE UNIQUE INDEX "Subject_userId_shortCode_key" ON "Subject"("userId", "shortCode");
