import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

// Use Env Var instead of file read
const PRIVATE_KEY = process.env.LICENSE_PRIVATE_KEY?.replace(/\\n/g, '\n');

export async function POST(request) {
    try {
        const body = await request.json();
        const { license_key, hwid } = body;

        // 1. Fetch from Neon DB
        const license = await prisma.license.findUnique({
            where: { key: license_key },
        });

        if (!license) {
            return NextResponse.json({ message: "Invalid License Key" }, { status: 401 });
        }

        if (license.status !== "ACTIVE") {
            return NextResponse.json({ message: `License is ${license.status}` }, { status: 403 });
        }

        // 2. Check Expiry
        if (license.expiresAt && new Date() > new Date(license.expiresAt)) {
            return NextResponse.json({ message: "License Expired" }, { status: 403 });
        }

        // 3. Lock Check
        if (license.lockedHwid && license.lockedHwid !== hwid) {
            return NextResponse.json({ message: "License used on another device" }, { status: 403 });
        }

        // 4. Update Lock (First time use)
        if (!license.lockedHwid) {
            await prisma.license.update({
                where: { id: license.id },
                data: { lockedHwid: hwid, lastCheckIn: new Date() }
            });
        }

        // 5. Generate Token
        // Calculate AMC Expiry (Use DB expiry or default to 1 year)
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
        console.error(error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}