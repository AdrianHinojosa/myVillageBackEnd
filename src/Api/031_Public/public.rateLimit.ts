import { Response, Request, NextFunction } from 'express';
import MyError from '../../Middlewares/Error.mw';
import ErrorMessages from '../../Utils/ErrorMessages.util';

/**
 * Punto 18 — rate-limit del registro público (anti-abuso).
 *
 * En memoria y por IP: best-effort para una sola instancia (suficiente para el volumen de altas
 * You/You+). Si el backend escala horizontalmente, migrar a un store compartido (Redis) o al WAF.
 * La validación de correo único es la defensa principal; esto solo frena floods.
 */
const iWindowMs = 10 * 60 * 1000; // 10 minutos
const iMaxHits = 5;               // máx. peticiones por IP+ruta en la ventana

const oHits: Map<string, number[]> = new Map();

/**
 * IP real del cliente. Detrás de CloudFront/ALB/nginx `req.ip` es la IP del proxy (todo el tráfico
 * compartiría un solo bucket y bloquearía a todos). Tomamos el primer salto de `X-Forwarded-For`.
 */
function getClientIp(req: Request): string {
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim();
    if (Array.isArray(xff) && xff.length) return String(xff[0]).split(',')[0].trim();
    return (req.ip || req.socket?.remoteAddress || 'unknown').toString();
}

export function signupRateLimit() {
    return (req: Request, res: Response, next: NextFunction) => {
        // Bucket por IP + ruta (signup y schoolLead no comparten cupo).
        const sKey = `${getClientIp(req)}|${req.baseUrl}${req.path}`;
        const iNow = Date.now();

        // Conserva solo los hits dentro de la ventana vigente.
        const aRecent = (oHits.get(sKey) || []).filter((t) => iNow - t < iWindowMs);

        if (aRecent.length >= iMaxHits) {
            const { sLang } = res.locals;
            return next(new MyError(429, ErrorMessages.Public.tooManyRequests[sLang || 'sp']));
        }

        aRecent.push(iNow);
        oHits.set(sKey, aRecent);
        return next();
    };
}
