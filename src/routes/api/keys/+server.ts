import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { apiKeys } from '$lib/server/db/schema';

// Utilidad para generar claves aleatorias
function generateRandomKey(length: number) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export const POST: RequestHandler = async () => {
    // Generar par de claves
    const publicKey = generateRandomKey(64);
    const privateKey = generateRandomKey(64);
    try {
        await db.insert(apiKeys).values({ publicKey, privateKey });
        return new Response(JSON.stringify({ publicKey, privateKey }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response('Error al generar claves', { status: 500 });
    }
};
