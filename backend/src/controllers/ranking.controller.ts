import { Request, Response } from 'express';
import { PrismaClient, RankingStatus } from '@prisma/client';
import { generateCertificate } from '../services/pdf';

const prisma = new PrismaClient();

const RANKING_CREATION_COST = 10;

export async function createRanking(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const {
      title,
      subcategoryId,
      periodType,
      periodStart,
      periodEnd,
      rankingDurationDays,
      pointsPerRank,
      description,
      imageUrl,
    } = req.body;

    // Check user balance
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.ranksBalance < RANKING_CREATION_COST) {
      res.status(400).json({
        error: `Insufficient Ranks. You need at least ${RANKING_CREATION_COST} Ranks to create a ranking.`,
        currentBalance: user.ranksBalance,
        required: RANKING_CREATION_COST,
      });
      return;
    }

    // Verify subcategory exists
    const subcategory = await prisma.subcategory.findUnique({ where: { id: subcategoryId } });
    if (!subcategory) {
      res.status(404).json({ error: 'Subcategory not found' });
      return;
    }

    // Use transaction to deduct ranks and create ranking
    const ranking = await prisma.$transaction(async (tx) => {
      // Deduct ranks
      await tx.user.update({
        where: { id: userId },
        data: { ranksBalance: { decrement: RANKING_CREATION_COST } },
      });

      // Create ranking
      const newRanking = await tx.ranking.create({
        data: {
          title,
          subcategoryId,
          initiatorId: userId,
          periodType,
          periodStart: new Date(periodStart),
          periodEnd: new Date(periodEnd),
          rankingDurationDays,
          pointsPerRank: pointsPerRank || 20,
          status: 'Active',
          description: description || null,
          imageUrl: imageUrl || null,
        },
        include: {
          subcategory: {
            include: { category: true },
          },
          initiator: {
            select: { id: true, username: true },
          },
        },
      });

      return newRanking;
    });

    res.status(201).json({
      message: 'Ranking created successfully',
      ranking,
      ranksDeducted: RANKING_CREATION_COST,
    });
  } catch (error) {
    console.error('Create ranking error:', error);
    res.status(500).json({ error: 'Failed to create ranking' });
  }
}

export async function listRankings(req: Request, res: Response): Promise<void> {
  try {
    const {
      status,
      categoryId,
      subcategoryId,
      search,
      initiatorId,
      page: pageStr,
      limit: limitStr,
    } = req.query;

    const page = Math.max(1, parseInt(pageStr as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitStr as string, 10) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      const statusStr = (status as string).toLowerCase();
      if (statusStr === 'active') where.status = 'Active' as RankingStatus;
      else if (statusStr === 'completed') where.status = 'Completed' as RankingStatus;
      else if (statusStr === 'draft') where.status = 'Draft' as RankingStatus;
      else if (statusStr === 'expired') where.status = 'Expired' as RankingStatus;
    }

    if (initiatorId) {
      where.initiatorId = initiatorId as string;
    }

    if (subcategoryId) {
      where.subcategoryId = subcategoryId as string;
    } else if (categoryId) {
      const subcategories = await prisma.subcategory.findMany({
        where: { categoryId: categoryId as string },
        select: { id: true },
      });
      where.subcategoryId = { in: subcategories.map((s) => s.id) };
    }

    if (search) {
      where.title = { contains: search as string, mode: 'insensitive' };
    }

    const [rankings, totalCount] = await Promise.all([
      prisma.ranking.findMany({
        where,
        include: {
          initiator: {
            select: { id: true, username: true },
          },
          subcategory: {
            select: { id: true, name: true, slug: true },
          },
          _count: {
            select: { votes: true, comments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.ranking.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      rankings,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('List rankings error:', error);
    res.status(500).json({ error: 'Failed to list rankings' });
  }
}

export async function getRanking(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const ranking = await prisma.ranking.findUnique({
      where: { id },
      include: {
        initiator: {
          select: { id: true, username: true, isAdmin: true },
        },
        subcategory: {
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        votes: {
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
          orderBy: { pointsVoted: 'desc' },
        },
        comments: {
          include: {
            user: {
              select: { id: true, username: true },
            },
            _count: {
              select: { likes: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        revenueDistribution: true,
        winnerCertificate: true,
        _count: {
          select: { votes: true, comments: true },
        },
      },
    });

    if (!ranking) {
      res.status(404).json({ error: 'Ranking not found' });
      return;
    }

    // Build leaderboard (top voters by total points)
    const leaderboard = ranking.votes.map((vote) => ({
      userId: vote.user.id,
      username: vote.user.username,
      pointsVoted: vote.pointsVoted,
      ranksSpent: vote.ranksSpent,
      motivationText: vote.motivationText,
      createdAt: vote.createdAt,
    }));

    // Check if current user has voted
    let userVote = null;
    if (req.user) {
      const existingVote = ranking.votes.find((v) => v.user.id === req.user!.id);
      if (existingVote) {
        userVote = {
          id: existingVote.id,
          pointsVoted: existingVote.pointsVoted,
          ranksSpent: existingVote.ranksSpent,
          motivationText: existingVote.motivationText,
          proofLinks: existingVote.proofLinks,
          createdAt: existingVote.createdAt,
        };
      }
    }

    res.status(200).json({
      ...ranking,
      leaderboard,
      userVote,
      votes: undefined,
      voteCount: ranking._count.votes,
      commentCount: ranking._count.comments,
      _count: undefined,
    });
  } catch (error) {
    console.error('Get ranking error:', error);
    res.status(500).json({ error: 'Failed to get ranking' });
  }
}

export async function vote(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { pointsVoted, motivationText, proofLinks, entityName } = req.body;

    // Get ranking
    const ranking = await prisma.ranking.findUnique({ where: { id } });
    if (!ranking) {
      res.status(404).json({ error: 'Ranking not found' });
      return;
    }

    if (ranking.status !== 'Active') {
      res.status(400).json({ error: 'This ranking is not accepting votes' });
      return;
    }

    // Check if ranking period has expired
    const now = new Date();
    const rankingEnd = new Date(ranking.createdAt);
    rankingEnd.setDate(rankingEnd.getDate() + ranking.rankingDurationDays);
    if (now > rankingEnd) {
      res.status(400).json({ error: 'Voting period for this ranking has ended' });
      return;
    }

    // Calculate ranks cost
    const ranksSpent = pointsVoted * ranking.pointsPerRank;

    // Check user balance
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.ranksBalance < ranksSpent) {
      res.status(400).json({
        error: `Insufficient Ranks. You need ${ranksSpent} Ranks for this vote.`,
        currentBalance: user?.ranksBalance || 0,
        required: ranksSpent,
      });
      return;
    }

    // Check if user already voted (before transaction for scope)
    const existingVote = await prisma.vote.findUnique({
      where: { userId_rankingId: { userId, rankingId: id } },
    });

    // Use transaction to upsert vote, update balance, and update ranking
    const result = await prisma.$transaction(async (tx) => {
      // Deduct ranks
      await tx.user.update({
        where: { id: userId },
        data: { ranksBalance: { decrement: ranksSpent } },
      });

      let voteResult;
      if (existingVote) {
        // Update existing vote
        voteResult = await tx.vote.update({
          where: { id: existingVote.id },
          data: {
            pointsVoted,
            ranksSpent,
            motivationText,
            proofLinks,
          },
          include: {
            user: { select: { id: true, username: true } },
          },
        });

        // Update totalVotesCollected (adjust by difference)
        const rankDifference = ranksSpent - existingVote.ranksSpent;
        await tx.ranking.update({
          where: { id },
          data: { totalVotesCollected: { increment: rankDifference } },
        });
      } else {
        // Create new vote
        voteResult = await tx.vote.create({
          data: {
            userId,
            rankingId: id,
            pointsVoted,
            ranksSpent,
            motivationText,
            proofLinks,
          },
          include: {
            user: { select: { id: true, username: true } },
          },
        });

        // Update totalVotesCollected
        await tx.ranking.update({
          where: { id },
          data: { totalVotesCollected: { increment: ranksSpent } },
        });
      }

      return voteResult;
    });

    res.status(200).json({
      message: existingVote ? 'Vote updated successfully' : 'Vote cast successfully',
      vote: result,
      ranksSpent,
      isUpdate: !!existingVote,
    });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ error: 'Failed to cast vote' });
  }
}

export async function closeRanking(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Get ranking
    const ranking = await prisma.ranking.findUnique({
      where: { id },
      include: {
        votes: {
          include: {
            user: { select: { id: true, username: true } },
          },
        },
      },
    });

    if (!ranking) {
      res.status(404).json({ error: 'Ranking not found' });
      return;
    }

    if (ranking.initiatorId !== userId) {
      res.status(403).json({ error: 'Only the ranking initiator can close this ranking' });
      return;
    }

    if (ranking.status === 'Completed') {
      res.status(400).json({ error: 'Ranking is already completed' });
      return;
    }

    // Calculate winner (user/vote with highest total pointsVoted)
    const voteTotals = new Map<string, { userId: string; username: string; totalPoints: number }>();
    for (const vote of ranking.votes) {
      const key = vote.user.id;
      const existing = voteTotals.get(key);
      if (existing) {
        existing.totalPoints += vote.pointsVoted;
      } else {
        voteTotals.set(key, {
          userId: vote.user.id,
          username: vote.user.username,
          totalPoints: vote.pointsVoted,
        });
      }
    }

    if (voteTotals.size === 0) {
      res.status(400).json({ error: 'Cannot close a ranking with no votes' });
      return;
    }

    // Sort to find winner
    const sortedVoters = Array.from(voteTotals.values()).sort((a, b) => b.totalPoints - a.totalPoints);
    const winner = sortedVoters[0];

    // Calculate revenue distribution (25% each)
    const totalRanks = ranking.totalVotesCollected;
    const share = totalRanks / 4;

    // Generate certificate
    let certificateFilename: string | null = null;
    try {
      const certResult = await generateCertificate(ranking.title, winner.username, new Date());
      certificateFilename = certResult.filename;
    } catch (certError) {
      console.error('Certificate generation failed:', certError);
      // Continue without certificate
    }

    // Update ranking, create distribution and certificate in transaction
    await prisma.$transaction(async (tx) => {
      // Update ranking
      await tx.ranking.update({
        where: { id },
        data: {
          status: 'Completed',
          winnerEntityName: winner.username,
          winnerCertificateUrl: certificateFilename,
          closedAt: new Date(),
        },
      });

      // Create revenue distribution
      await tx.revenueDistribution.create({
        data: {
          rankingId: id,
          totalRanks,
          initiatorShare: share,
          charityShare: share,
          topContributorsShare: share,
          platformShare: share,
          distributionStatus: 'Pending',
        },
      });

      // Create winner certificate record
      if (certificateFilename) {
        await tx.winnerCertificate.create({
          data: {
            rankingId: id,
            winnerName: winner.username,
            certificatePdfUrl: certificateFilename,
          },
        });
      }
    });

    res.status(200).json({
      message: 'Ranking closed successfully',
      winner: {
        name: winner.username,
        totalPoints: winner.totalPoints,
      },
      revenueDistribution: {
        totalRanks,
        initiatorShare: share,
        charityShare: share,
        topContributorsShare: share,
        platformShare: share,
      },
      certificate: certificateFilename,
    });
  } catch (error) {
    console.error('Close ranking error:', error);
    res.status(500).json({ error: 'Failed to close ranking' });
  }
}

export async function listTrending(req: Request, res: Response): Promise<void> {
  try {
    const rankings = await prisma.ranking.findMany({
      where: {
        status: 'Active',
      },
      include: {
        initiator: {
          select: { id: true, username: true },
        },
        subcategory: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { votes: true, comments: true },
        },
      },
      orderBy: [{ totalVotesCollected: 'desc' }, { createdAt: 'desc' }],
      take: 20,
    });

    res.status(200).json(rankings);
  } catch (error) {
    console.error('List trending error:', error);
    res.status(500).json({ error: 'Failed to list trending rankings' });
  }
}
