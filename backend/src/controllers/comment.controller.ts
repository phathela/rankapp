import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function addComment(req: Request, res: Response): Promise<void> {
  try {
    const { id: rankingId } = req.params;
    const userId = req.user!.id;
    const { commentText } = req.body;

    // Check if ranking exists
    const ranking = await prisma.ranking.findUnique({ where: { id: rankingId } });
    if (!ranking) {
      res.status(404).json({ error: 'Ranking not found' });
      return;
    }

    // Check if user has voted on this ranking
    const vote = await prisma.vote.findUnique({
      where: { userId_rankingId: { userId, rankingId } },
    });

    if (!vote) {
      res.status(403).json({ error: 'Only users who voted on this ranking can comment' });
      return;
    }

    // Check if user already has a comment on this ranking (one comment per ranking)
    const existingComment = await prisma.comment.findFirst({
      where: { userId, rankingId },
    });
    if (existingComment) {
      res.status(400).json({ error: 'You have already commented on this ranking' });
      return;
    }

    // Create comment linked to vote
    const comment = await prisma.comment.create({
      data: {
        userId,
        rankingId,
        voteId: vote.id,
        commentText,
      },
      include: {
        user: {
          select: { id: true, username: true },
        },
        _count: {
          select: { likes: true },
        },
      },
    });

    res.status(201).json({
      message: 'Comment added successfully',
      comment,
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
}

export async function likeComment(req: Request, res: Response): Promise<void> {
  try {
    const { id: commentId } = req.params;
    const userId = req.user!.id;

    // Check if comment exists
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    // Toggle like
    const existingLike = await prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });

    if (existingLike) {
      // Unlike
      await prisma.commentLike.delete({
        where: { id: existingLike.id },
      });

      res.status(200).json({
        message: 'Comment unliked',
        liked: false,
      });
    } else {
      // Like
      await prisma.commentLike.create({
        data: { userId, commentId },
      });

      res.status(200).json({
        message: 'Comment liked',
        liked: true,
      });
    }
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ error: 'Failed to like comment' });
  }
}

export async function getComments(req: Request, res: Response): Promise<void> {
  try {
    const { id: rankingId } = req.params;
    const { page: pageStr, limit: limitStr } = req.query;

    const page = Math.max(1, parseInt(pageStr as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitStr as string, 10) || 20));
    const skip = (page - 1) * limit;

    // Check if ranking exists
    const ranking = await prisma.ranking.findUnique({ where: { id: rankingId } });
    if (!ranking) {
      res.status(404).json({ error: 'Ranking not found' });
      return;
    }

    const [comments, totalCount] = await Promise.all([
      prisma.comment.findMany({
        where: { rankingId },
        include: {
          user: {
            select: { id: true, username: true },
          },
          _count: {
            select: { likes: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.comment.count({ where: { rankingId } }),
    ]);

    // Check if current user liked each comment
    let commentsWithLikeStatus = comments;
    if (req.user) {
      const userLikes = await prisma.commentLike.findMany({
        where: {
          userId: req.user.id,
          commentId: { in: comments.map((c) => c.id) },
        },
      });
      const likedCommentIds = new Set(userLikes.map((l) => l.commentId));

      commentsWithLikeStatus = comments.map((comment) => ({
        ...comment,
        likedByMe: likedCommentIds.has(comment.id),
        _count: undefined,
        likeCount: comment._count.likes,
      }));
    }

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      comments: commentsWithLikeStatus,
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
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to get comments' });
  }
}
