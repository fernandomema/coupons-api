// API principal de cupones
// Métodos: POST (crear), GET (listar), PUT (validar/consumir)
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { coupons, apiKeys } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

// Utilidad para autenticar usando solo private key
async function authenticatePrivate(request: Request) {
    const privateKey = request.headers.get('x-private-key');
    if (!privateKey) return null;
    const key = await db.select().from(apiKeys).where(
        eq(apiKeys.privateKey, privateKey)
    ).then(rows => rows[0]);
    return key;
}

export const POST: RequestHandler = async ({ request }) => {
    // Crear cupón
    const key = await authenticatePrivate(request);
    if (!key) return new Response('Unauthorized', { status: 401 });
    const { code, maxUses, description } = await request.json();
    if (!code || !maxUses) return new Response('Faltan datos', { status: 400 });
    try {
        await db.insert(coupons).values({
            code,
            maxUses,
            usesLeft: maxUses,
            description,
            createdBy: key.id
        });
        return new Response('Cupón creado', { status: 201 });
    } catch (e) {
        return new Response('Error al crear cupón', { status: 500 });
    }
};

export const GET: RequestHandler = async ({ request }) => {
    const publicKey = request.headers.get('x-public-key');
    const privateKey = request.headers.get('x-private-key');
    let couponsList;
    if (privateKey) {
        // Buscar apiKey válida solo por privateKey
        const key = await authenticatePrivate(request);
        if (!key) {
            return new Response('Unauthorized', { status: 401 });
        }
        // Mostrar TODOS los cupones de ese apiKey y los públicos de otros
        couponsList = await db.select({
            coupon: coupons,
            key: apiKeys
        })
        .from(coupons)
        .leftJoin(apiKeys, eq(coupons.createdBy, apiKeys.id));
        const grouped: Record<string, any[]> = {};
        for (const { coupon, key: k } of couponsList) {
            if (!k) continue;
            if (coupon.createdBy === key.id && k.publicKey === key.publicKey) {
                if (!grouped[k.publicKey]) grouped[k.publicKey] = [];
                grouped[k.publicKey].push(coupon);
            } else if (coupon.public) {
                if (!grouped[k.publicKey]) grouped[k.publicKey] = [];
                grouped[k.publicKey].push(coupon);
            }
        }
        return new Response(JSON.stringify(grouped), {
            headers: { 'Content-Type': 'application/json' }
        });
    } else if (publicKey) {
        // Solo mostrar cupones públicos de ese publicKey
        couponsList = await db.select({
            coupon: coupons,
            key: apiKeys
        })
        .from(coupons)
        .leftJoin(apiKeys, eq(coupons.createdBy, apiKeys.id))
        .where(eq(coupons.public, true));
        const grouped: Record<string, any[]> = {};
        for (const { coupon, key: k } of couponsList) {
            if (!k) continue;
            if (k.publicKey === publicKey) {
                if (!grouped[k.publicKey]) grouped[k.publicKey] = [];
                grouped[k.publicKey].push(coupon);
            }
        }
        return new Response(JSON.stringify(grouped), {
            headers: { 'Content-Type': 'application/json' }
        });
    } else {
        return new Response('Falta x-public-key o x-private-key', { status: 400 });
    }
};

export const PUT: RequestHandler = async ({ request }) => {
    const publicKey = request.headers.get('x-public-key');
    if (!publicKey) return new Response('Falta x-public-key', { status: 400 });
    const { code } = await request.json();
    if (!code) return new Response('Falta código', { status: 400 });
    // Buscar el apiKey correspondiente
    const key = await db.select().from(apiKeys).where(eq(apiKeys.publicKey, publicKey)).then(rows => rows[0]);
    if (!key) return new Response('Unauthorized', { status: 401 });
    // Buscar el cupón creado por ese apiKey
    const coupon = await db.select().from(coupons)
        .where(and(eq(coupons.code, code), eq(coupons.createdBy, key.id)))
        .then(rows => rows[0]);
    if (!coupon) return new Response('Cupón no encontrado', { status: 404 });
    if (coupon.usesLeft <= 0) return new Response('Cupón sin usos', { status: 400 });
    await db.update(coupons).set({ usesLeft: coupon.usesLeft - 1 }).where(eq(coupons.id, coupon.id));
    return new Response('Cupón consumido', { status: 200 });
};
