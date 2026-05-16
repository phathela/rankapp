import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function setEngagementScore(req: Request, res: Response): Promise<void> {
  try {
    const { userId, rankingId, motivationScore, finalScore } = req.body;

    // Verify ranking exists
    const ranking = await prisma.ranking.findUnique({ where: { id: rankingId } });
    if (!ranking) {
      res.status(404).json({ error: 'Ranking not found' });
      return;
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Upsert engagement score
    const score = await prisma.engagementScore.upsert({
      where: {
        userId_rankingId: { userId, rankingId },
      },
      update: {
        ...(motivationScore !== undefined && { motivationScore }),
        ...(finalScore !== undefined && { finalScore }),
      },
      create: {
        userId,
        rankingId,
        motivationScore: motivationScore ?? null,
        finalScore: finalScore ?? null,
      },
    });

    res.status(200).json({
      message: 'Engagement score set successfully',
      score,
    });
  } catch (error) {
    console.error('Set engagement score error:', error);
    res.status(500).json({ error: 'Failed to set engagement score' });
  }
}

export async function completeDistribution(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const distribution = await prisma.revenueDistribution.findUnique({
      where: { id },
    });

    if (!distribution) {
      res.status(404).json({ error: 'Revenue distribution not found' });
      return;
    }

    if (distribution.distributionStatus === 'Completed') {
      res.status(400).json({ error: 'Distribution is already completed' });
      return;
    }

    const updated = await prisma.revenueDistribution.update({
      where: { id },
      data: { distributionStatus: 'Completed' },
    });

    res.status(200).json({
      message: 'Distribution marked as completed',
      distribution: updated,
    });
  } catch (error) {
    console.error('Complete distribution error:', error);
    res.status(500).json({ error: 'Failed to complete distribution' });
  }
}

export async function listPendingDistributions(req: Request, res: Response): Promise<void> {
  try {
    const distributions = await prisma.revenueDistribution.findMany({
      where: { distributionStatus: 'Pending' },
      include: {
        ranking: {
          select: {
            id: true,
            title: true,
            winnerEntityName: true,
            closedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(distributions);
  } catch (error) {
    console.error('List pending distributions error:', error);
    res.status(500).json({ error: 'Failed to list pending distributions' });
  }
}

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  try {
    const [totalUsers, totalRankings, totalRevenueResult, platformBalanceResult] = await Promise.all([
      prisma.user.count(),
      prisma.ranking.count(),
      prisma.transaction.aggregate({
        _sum: { amountUsd: true },
        where: { status: 'Completed' },
      }),
      prisma.revenueDistribution.aggregate({
        _sum: { platformShare: true, totalRanks: true },
        where: { distributionStatus: 'Completed' },
      }),
    ]);

    // Count rankings by status
    const rankingsByStatus = await prisma.ranking.groupBy({
      by: ['status'],
      _count: true,
    });

    const statusBreakdown = rankingsByStatus.reduce(
      (acc, curr) => {
        acc[curr.status] = curr._count;
        return acc;
      },
      {} as Record<string, number>
    );

    res.status(200).json({
      totalUsers,
      totalRankings,
      totalRevenue: totalRevenueResult._sum.amountUsd || 0,
      platformBalanceRanks: platformBalanceResult._sum.platformShare || 0,
      totalRanksDistributed: platformBalanceResult._sum.totalRanks || 0,
      rankingsByStatus: statusBreakdown,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
}
