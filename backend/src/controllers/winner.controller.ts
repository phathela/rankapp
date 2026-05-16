import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const CERTIFICATES_DIR = path.resolve(__dirname, '../../certificates');

export async function listWinners(req: Request, res: Response): Promise<void> {
  try {
    const { categoryId, subcategoryId, year, month } = req.query;

    const where: any = {
      status: 'Completed',
      winnerEntityName: { not: null },
    };

    if (subcategoryId) {
      where.subcategoryId = subcategoryId as string;
    } else if (categoryId) {
      const subcategories = await prisma.subcategory.findMany({
        where: { categoryId: categoryId as string },
        select: { id: true },
      });
      where.subcategoryId = { in: subcategories.map((s) => s.id) };
    }

    // Date filters
    if (year) {
      const yearNum = parseInt(year as string, 10);
      const startDate = new Date(yearNum, 0, 1);
      const endDate = new Date(yearNum + 1, 0, 1);
      where.closedAt = { gte: startDate, lt: endDate };
    }

    if (month && year) {
      const yearNum = parseInt(year as string, 10);
      const monthNum = parseInt(month as string, 10) - 1; // 0-indexed
      const startDate = new Date(yearNum, monthNum, 1);
      const endDate = new Date(yearNum, monthNum + 1, 1);
      where.closedAt = { gte: startDate, lt: endDate };
    }

    const winners = await prisma.ranking.findMany({
      where,
      select: {
        id: true,
        title: true,
        winnerEntityName: true,
        winnerCertificateUrl: true,
        closedAt: true,
        totalVotesCollected: true,
        subcategory: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        _count: {
          select: { votes: true },
        },
      },
      orderBy: { closedAt: 'desc' },
    });

    res.status(200).json(winners);
  } catch (error) {
    console.error('List winners error:', error);
    res.status(500).json({ error: 'Failed to list winners' });
  }
}

export async function getWinnerDetail(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const ranking = await prisma.ranking.findUnique({
      where: { id },
      include: {
        initiator: {
          select: { id: true, username: true },
        },
        subcategory: {
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        winnerCertificate: true,
        revenueDistribution: true,
        _count: {
          select: { votes: true, comments: true },
        },
      },
    });

    if (!ranking || ranking.status !== 'Completed' || !ranking.winnerEntityName) {
      res.status(404).json({ error: 'Winner not found' });
      return;
    }

    res.status(200).json(ranking);
  } catch (error) {
    console.error('Get winner detail error:', error);
    res.status(500).json({ error: 'Failed to get winner detail' });
  }
}

export async function getCertificate(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const winner = await prisma.winnerCertificate.findUnique({
      where: { rankingId: id },
    });

    if (!winner) {
      res.status(404).json({ error: 'Certificate not found' });
      return;
    }

    const filePath = path.join(CERTIFICATES_DIR, winner.certificatePdfUrl);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Certificate file not found on disk' });
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${winner.certificatePdfUrl}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({ error: 'Failed to download certificate' });
  }
}
