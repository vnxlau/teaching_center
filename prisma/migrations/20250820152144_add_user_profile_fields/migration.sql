-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "address" TEXT,
ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "smsNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "vatNumber" TEXT;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
