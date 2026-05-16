-- CreateEnum
CREATE TYPE "PeriodType" AS ENUM ('Month', 'Year', 'BetweenMonths', 'BetweenYears');

-- CreateEnum
CREATE TYPE "RankingStatus" AS ENUM ('Draft', 'Active', 'Completed', 'Expired');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('Pending', 'Completed', 'Failed');

-- CreateEnum
CREATE TYPE "DistributionStatus" AS ENUM ('Pending', 'Completed');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "ranks_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon_url" TEXT,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcategories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "subcategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rankings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subcategory_id" TEXT NOT NULL,
    "initiator_id" TEXT NOT NULL,
    "period_type" "PeriodType" NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "ranking_duration_days" INTEGER NOT NULL,
    "points_per_rank" INTEGER NOT NULL DEFAULT 20,
    "status" "RankingStatus" NOT NULL DEFAULT 'Draft',
    "total_votes_collected" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "winner_entity_name" TEXT,
    "winner_certificate_url" TEXT,
    "description" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "rankings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ranking_id" TEXT NOT NULL,
    "points_voted" INTEGER NOT NULL,
    "ranks_spent" DOUBLE PRECISION NOT NULL,
    "motivation_text" TEXT NOT NULL,
    "proof_links" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ranking_id" TEXT NOT NULL,
    "vote_id" TEXT,
    "comment_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_likes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "comment_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount_ranks" DOUBLE PRECISION NOT NULL,
    "amount_usd" INTEGER,
    "stripe_payment_intent_id" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'Pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_distributions" (
    "id" TEXT NOT NULL,
    "ranking_id" TEXT NOT NULL,
    "total_ranks" DOUBLE PRECISION NOT NULL,
    "initiator_share" DOUBLE PRECISION NOT NULL,
    "charity_share" DOUBLE PRECISION NOT NULL,
    "top_contributors_share" DOUBLE PRECISION NOT NULL,
    "platform_share" DOUBLE PRECISION NOT NULL,
    "charity_name" TEXT,
    "charity_contact" TEXT,
    "distribution_status" "DistributionStatus" NOT NULL DEFAULT 'Pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revenue_distributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_scores" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ranking_id" TEXT NOT NULL,
    "motivation_score" INTEGER,
    "shares_count" INTEGER NOT NULL DEFAULT 0,
    "comments_likes" INTEGER NOT NULL DEFAULT 0,
    "final_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "engagement_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "winner_certificates" (
    "id" TEXT NOT NULL,
    "ranking_id" TEXT NOT NULL,
    "winner_name" TEXT NOT NULL,
    "certificate_pdf_url" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "winner_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "category_subscriptions_user_id_category_id_key" ON "category_subscriptions"("user_id", "category_id");

-- CreateIndex
CREATE UNIQUE INDEX "subcategories_slug_category_id_key" ON "subcategories"("slug", "category_id");

-- CreateIndex
CREATE UNIQUE INDEX "votes_user_id_ranking_id_key" ON "votes"("user_id", "ranking_id");

-- CreateIndex
CREATE UNIQUE INDEX "comments_vote_id_key" ON "comments"("vote_id");

-- CreateIndex
CREATE UNIQUE INDEX "comment_likes_user_id_comment_id_key" ON "comment_likes"("user_id", "comment_id");

-- CreateIndex
CREATE UNIQUE INDEX "revenue_distributions_ranking_id_key" ON "revenue_distributions"("ranking_id");

-- CreateIndex
CREATE UNIQUE INDEX "engagement_scores_user_id_ranking_id_key" ON "engagement_scores"("user_id", "ranking_id");

-- CreateIndex
CREATE UNIQUE INDEX "winner_certificates_ranking_id_key" ON "winner_certificates"("ranking_id");

-- AddForeignKey
ALTER TABLE "category_subscriptions" ADD CONSTRAINT "category_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_subscriptions" ADD CONSTRAINT "category_subscriptions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_initiator_id_fkey" FOREIGN KEY ("initiator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_ranking_id_fkey" FOREIGN KEY ("ranking_id") REFERENCES "rankings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_ranking_id_fkey" FOREIGN KEY ("ranking_id") REFERENCES "rankings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_vote_id_fkey" FOREIGN KEY ("vote_id") REFERENCES "votes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_distributions" ADD CONSTRAINT "revenue_distributions_ranking_id_fkey" FOREIGN KEY ("ranking_id") REFERENCES "rankings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_scores" ADD CONSTRAINT "engagement_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_scores" ADD CONSTRAINT "engagement_scores_ranking_id_fkey" FOREIGN KEY ("ranking_id") REFERENCES "rankings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "winner_certificates" ADD CONSTRAINT "winner_certificates_ranking_id_fkey" FOREIGN KEY ("ranking_id") REFERENCES "rankings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
