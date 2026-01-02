import { prisma } from '@/lib/prisma'; //
import { generateLicenseKey } from '@/lib/utils';

// Duration mappings in milliseconds
const DURATION_MAP = {
  MONTHLY: 30 * 24 * 60 * 60 * 1000,
  BIANNUAL: 180 * 24 * 60 * 60 * 1000,
  YEARLY: 365 * 24 * 60 * 60 * 1000,
};

/**
 * Creates a new license with calculated expiration
 */
export async function createLicense({ clientName, planType, notes }) {
  const now = new Date();
  let expiresAt = null;

  // Calculate Expiration
  if (planType !== 'LIFETIME' && DURATION_MAP[planType]) {
    expiresAt = new Date(now.getTime() + DURATION_MAP[planType]);
  }

  const key = generateLicenseKey();

  try {
    const newLicense = await prisma.license.create({
      data: {
        key,
        clientName,
        plan: planType,
        notes,
        startsAt: now,
        expiresAt: expiresAt,
        status: 'ACTIVE'
      }
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'LICENSE_CREATED',
        key: key,
        metadata: { plan: planType, expires: expiresAt }
      }
    });

    return { success: true, license: newLicense };
  } catch (error) {
    console.error("License generation failed:", error);
    return { success: false, error: "Database error" };
  }
}

/**
 * Validation Logic (Used by API)
 */
export function isLicenseValid(license) {
  if (!license) return false;
  if (license.status !== 'ACTIVE') return false;

  // Check Expiry
  if (license.expiresAt && new Date() > new Date(license.expiresAt)) {
    return false;
  }

  return true;
}