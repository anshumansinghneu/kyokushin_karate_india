import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { catchAsync } from '../utils/catchAsync';

const prisma = new PrismaClient();

/**
 * POST /api/analytics/visit — record a page visit
 * Public endpoint, no auth required. Uses IP geolocation.
 */
export const recordVisit = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const { fingerprint, path, referrer } = req.body;

    if (!fingerprint) {
        return res.status(400).json({ status: 'fail', message: 'fingerprint is required' });
    }

    // Get IP from headers (works behind proxy/Vercel/Render)
    const ip = (
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] as string ||
        req.socket.remoteAddress ||
        ''
    ).replace('::ffff:', '');

    const userAgent = req.headers['user-agent'] || '';

    // Geo-locate using free ip-api.com (no key needed, 45 req/min)
    let country: string | null = null;
    let city: string | null = null;
    let region: string | null = null;

    try {
        // Skip for localhost / private IPs
        if (ip && !ip.startsWith('127.') && !ip.startsWith('192.168.') && !ip.startsWith('10.') && ip !== '::1') {
            const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`, {
                signal: AbortSignal.timeout(3000),
            });
            if (geoRes.ok) {
                const geo = await geoRes.json();
                if (geo.status === 'success') {
                    country = geo.country || null;
                    city = geo.city || null;
                    region = geo.regionName || null;
                }
            }
        }
    } catch {
        // Geo lookup failed, continue without it
    }

    await prisma.siteVisit.create({
        data: {
            fingerprint,
            ip: ip || null,
            country,
            city,
            region,
            userAgent: userAgent.slice(0, 500),
            path: path || null,
            referrer: referrer || null,
        },
    });

    res.status(201).json({ status: 'ok' });
});

/**
 * GET /api/analytics/stats — admin-only analytics dashboard data
 */
export const getAnalyticsStats = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const { days = '30' } = req.query;
    const daysNum = Math.min(parseInt(days as string, 10) || 30, 365);
    const since = new Date();
    since.setDate(since.getDate() - daysNum);

    // Total visits & unique visitors
    const [totalVisits, uniqueVisitors] = await Promise.all([
        prisma.siteVisit.count({ where: { createdAt: { gte: since } } }),
        prisma.siteVisit.groupBy({
            by: ['fingerprint'],
            where: { createdAt: { gte: since } },
        }).then(r => r.length),
    ]);

    // Visits per day (for chart)
    const visitsByDay = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
        SELECT DATE(\"createdAt\") as date, COUNT(*) as count
        FROM "SiteVisit"
        WHERE "createdAt" >= ${since}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
    `;

    // Top countries
    const topCountries = await prisma.$queryRaw<{ country: string; visitors: bigint }[]>`
        SELECT COALESCE(country, 'Unknown') as country, COUNT(DISTINCT fingerprint) as visitors
        FROM "SiteVisit"
        WHERE "createdAt" >= ${since}
        GROUP BY country
        ORDER BY visitors DESC
        LIMIT 20
    `;

    // Top cities
    const topCities = await prisma.$queryRaw<{ city: string; country: string; visitors: bigint }[]>`
        SELECT COALESCE(city, 'Unknown') as city, COALESCE(country, 'Unknown') as country, COUNT(DISTINCT fingerprint) as visitors
        FROM "SiteVisit"
        WHERE "createdAt" >= ${since}
        GROUP BY city, country
        ORDER BY visitors DESC
        LIMIT 20
    `;

    // Top pages
    const topPages = await prisma.$queryRaw<{ path: string; views: bigint }[]>`
        SELECT COALESCE(path, '/') as path, COUNT(*) as views
        FROM "SiteVisit"
        WHERE "createdAt" >= ${since}
        GROUP BY path
        ORDER BY views DESC
        LIMIT 15
    `;

    // Recent visitors (last 50)
    const recentVisitors = await prisma.siteVisit.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
            id: true,
            fingerprint: true,
            country: true,
            city: true,
            region: true,
            path: true,
            referrer: true,
            createdAt: true,
        },
    });

    // Serialize bigints
    const serialize = (arr: any[]) => arr.map(item => {
        const obj: any = {};
        for (const [key, val] of Object.entries(item)) {
            obj[key] = typeof val === 'bigint' ? Number(val) : val;
        }
        return obj;
    });

    res.json({
        status: 'success',
        data: {
            period: { days: daysNum, since: since.toISOString() },
            totalVisits,
            uniqueVisitors,
            visitsByDay: serialize(visitsByDay),
            topCountries: serialize(topCountries),
            topCities: serialize(topCities),
            topPages: serialize(topPages),
            recentVisitors,
        },
    });
});
