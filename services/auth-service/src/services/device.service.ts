import { UAParser } from 'ua-parser-js';
import geoip from 'geoip-lite';
import crypto from 'crypto';
import { Request } from 'express';
import requestIp from 'request-ip';

export interface DeviceInfo {
    deviceId: string;
    deviceType: string;
    browser: string;
    os: string;
    ipAddress: string;
    location: string;
}

export class DeviceService {
    static getDeviceInfo(req: Request): DeviceInfo {
        const ipAddress = requestIp.getClientIp(req) || 'unknown';
        const userAgent = req.headers['user-agent'] || '';
        const parser = new UAParser(userAgent);
        const result = parser.getResult();
        
        // Geo Location
        const geo = geoip.lookup(ipAddress);
        const location = geo ? `${geo.city}, ${geo.country}` : 'Unknown';

        // Generate Fingerprint
        // We hash IP + UA + Accept-Language to create a "Device ID"
        const rawFingerprint = `${ipAddress}-${userAgent}-${req.headers['accept-language'] || ''}`;
        const deviceId = crypto.createHash('sha256').update(rawFingerprint).digest('hex');

        return {
            deviceId,
            deviceType: result.device.type || 'desktop', // default to desktop if undefined
            browser: `${result.browser.name} ${result.browser.version}`,
            os: `${result.os.name} ${result.os.version}`,
            ipAddress,
            location
        };
    }
}