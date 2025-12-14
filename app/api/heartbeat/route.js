import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const PRIVATE_KEY = process.env.LICENSE_PRIVATE_KEY?.replace(/\\n/g, '\n');

export async function POST(request) {
    try {
        const body = await request.json();
        const { license_key, hwid } = body;

        // 1. Fetch & Verify Lock
        const license = await prisma.license.findUnique({
            where: { key: license_key },
        });

        if (!license || license.lockedHwid !== hwid || license.status !== 'ACTIVE') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }

        // 2. Check Expiry
        if (license.expiresAt && new Date() > new Date(license.expiresAt)) {
            return NextResponse.json({ message: "License Expired" }, { status: 403 });
        }

        // 3. Update 'Last Seen'
        await prisma.license.update({
            where: { id: license.id },
            data: { lastCheckIn: new Date() }
        });

        // 4. Issue Fresh Token
        let amcTimestamp;
        if (license.expiresAt) {
            amcTimestamp = Math.floor(new Date(license.expiresAt).getTime() / 1000);
        } else {
            amcTimestamp = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60);
        }

        const token = jwt.sign(
            { sub: license_key, hwid: hwid, amc_exp: amcTimestamp },
            PRIVATE_KEY,
            { algorithm: 'RS256', expiresIn: '7d' }
        );

        return NextResponse.json({ token });

    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}