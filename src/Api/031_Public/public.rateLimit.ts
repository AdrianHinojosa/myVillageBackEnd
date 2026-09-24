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
const iMaxHits = 5;               // máx. altas por IP en la ventana

const oHits: Map<string, number[]> = new Map();

export function signupRateLimit() {
    return (req: Request, res: Response, next: NextFunction) => {
        const sIp = (req.ip || req.socket?.remoteAddress || 'unknown').toString();
        const iNow = Date.now();

        // Conserva solo los hits dentro de la ventana vigente.
        const aRecent = (oHits.get(sIp) || []).filter((t) => iNow - t < iWindowMs);

        if (aRecent.length >= iMaxHits) {
            const { sLang } = res.locals;
            return next(new MyError(429, ErrorMessages.Public.tooManyRequests[sLang || 'sp']));
        }

        aRecent.push(iNow);
        oHits.set(sIp, aRecent);
        return next();
    };
}
