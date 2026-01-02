import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const PRIVATE_KEY = process.env.LICENSE_PRIVATE_KEY?.replace(/\\n/g, '\n');

export async function POST(request) {
    try {
        const body = await request.json();
        const { license_key, hwid } = body;

        
        const license = await prisma.license.findUnique({
            where: { key: license_key },
        });

        if (!license) {
            return NextResponse.json({ message: "Invalid License Key" }, { status: 401 });
        }

        const now = new Date();
        const isExpired = license.expiresAt && now > new Date(license.expiresAt);
        const isNotActive = license.status !== "ACTIVE";

        if (isExpired && !isNotActive) {
            await prisma.license.update({
                where: { id: license.id },
                data: { status: 'EXPIRED' }
            });
            return NextResponse.json({ message: "License Expired" }, { status: 403 });
        }

        if (isNotActive) {
            return NextResponse.json({ message: `License is ${license.status}` }, { status: 403 });
        }

        // 3. Lock Check
        if (license.lockedHwid && license.lockedHwid !== hwid) {
            return NextResponse.json({ message: "License used on another device" }, { status: 403 });
        }

        // 4. Update Lock (First time use)
        if (!license.lockedHwid) {
            await prisma.license.update({
                where: { id: license.id },
                data: { lockedHwid: hwid, lastCheckIn: now }
            });
        } else {
            // Update check-in time without locking overhead
            await prisma.license.update({
                where: { id: license.id },
                data: { lastCheckIn: now }
            });
        }

        // 5. Generate Dynamic Token Duration
        // Default cap: 7 days in seconds
        let tokenDuration = 7 * 24 * 60 * 60; 

        if (license.expiresAt) {
            
            const expiryDate = new Date(license.expiresAt);
            const secondsUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / 1000);

            // If the license expires sooner than 7 days, limit the token
            if (secondsUntilExpiry < tokenDuration) {
                tokenDuration = secondsUntilExpiry;
            }
        }

        // Safety: Ensure we don't issue negative duration tokens
        if (tokenDuration <= 0) {
            return NextResponse.json({ message: "License Expired" }, { status: 403 });
        }

        // 6. Calculate AMC Expiry (for client-side display only)
        let amcTimestamp;
        if (license.expiresAt) {
            amcTimestamp = Math.floor(new Date(license.expiresAt).getTime() / 1000);
        } else {
            amcTimestamp = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60);
        }

        const token = jwt.sign(
            { sub: license_key, hwid: hwid, amc_exp: amcTimestamp },
            PRIVATE_KEY,
            { 
                algorithm: 'RS256', 
                expiresIn: tokenDuration // Pass INTEGER seconds here, not string '7d'
            }
        );

        return NextResponse.json({ token });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}