import crypto from "node:crypto"

export function generateLicenseKey(prefix = '1CLICK') {
    
  const buffer = crypto.randomBytes(12);
  
  
  const raw = buffer.toString('hex').toUpperCase();
  
  
  const part1 = raw.substring(0, 4);
  const part2 = raw.substring(4, 8);
  const part3 = raw.substring(8, 12);
  
  return `${prefix}-${part1}-${part2}-${part3}`;
}