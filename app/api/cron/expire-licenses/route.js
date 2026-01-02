import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Security: Ensure only your cron service can call this
export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();

    // Bulk update all licenses that are ACTIVE but past their expiration date
    const result = await prisma.license.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          lt: now, // Less than now (past)
          not: null // Ignore lifetimes
        }
      },
      data: {
        status: 'EXPIRED'
      }
    });

    // Optional: Log execution
    if (result.count > 0) {
      console.log(`Cron: Expired ${result.count} licenses.`);
      await prisma.auditLog.create({
        data: {
          action: 'CRON_EXPIRY_BATCH',
          key: 'SYSTEM',
          metadata: { count: result.count }
        }
      });
    }

    return NextResponse.json({ success: true, expiredCount: result.count });
  } catch (error) {
    console.error('Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}