import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function listCategories(req: Request, res: Response): Promise<void> {
  try {
    const categories = await prisma.category.findMany({
      include: {
        subcategories: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { subscriptions: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json(categories);
  } catch (error) {
    console.error('List categories error:', error);
    res.status(500).json({ error: 'Failed to list categories' });
  }
}

export async function getCategory(req: Request, res: Response): Promise<void> {
  try {
    const { slug } = req.params;

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        subcategories: {
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: { rankings: true },
            },
          },
        },
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // Count active rankings per subcategory
    const subcategoriesWithActiveCounts = await Promise.all(
      category.subcategories.map(async (sub) => {
        const activeCount = await prisma.ranking.count({
          where: {
            subcategoryId: sub.id,
            status: 'Active',
          },
        });
        return {
          ...sub,
          activeRankingCount: activeCount,
          _count: undefined,
        };
      })
    );

    res.status(200).json({
      ...category,
      subcategories: subcategoriesWithActiveCounts,
      _count: undefined,
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Failed to get category' });
  }
}
