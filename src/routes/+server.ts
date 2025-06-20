import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = () => {
  return new Response(null, {
    status: 302,
    headers: {
      location: '/swagger-ui'
    }
  });
};
