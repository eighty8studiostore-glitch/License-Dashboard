export const LICENSE_DB = [
  {
    key: "EIGHTY8-GOLD-001",
    lockedHwid: null, // Null means "never used", ready to be locked
    expiry: null // Null means lifetime, or set a date
  },
  {
    key: "EIGHTY8-TRIAL-001",
    lockedHwid: null,
    expiry: "2025-12-13T14:38:59Z"
  }
];

// In a real app, you'd use: import prisma from './prisma'