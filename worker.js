// Cloudflare Worker for Emacs Website API

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // API Routes
      if (url.pathname === '/api/buffers' && request.method === 'GET') {
        return await getBuffers(env, corsHeaders);
      }

      if (url.pathname === '/api/buffers' && request.method === 'POST') {
        return await createBuffer(request, env, corsHeaders);
      }

      if (url.pathname.startsWith('/api/buffers/') && request.method === 'GET') {
        const id = url.pathname.split('/')[3];
        return await getBuffer(id, env, corsHeaders);
      }

      if (url.pathname.startsWith('/api/buffers/') && request.method === 'PUT') {
        const id = url.pathname.split('/')[3];
        return await updateBuffer(id, request, env, corsHeaders);
      }

      if (url.pathname.startsWith('/api/buffers/') && request.method === 'DELETE') {
        const id = url.pathname.split('/')[3];
        return await deleteBuffer(id, env, corsHeaders);
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};

// Get all public buffers
async function getBuffers(env, corsHeaders) {
  const { results } = await env.DB.prepare(
    'SELECT id, name, created_at, updated_at FROM buffers WHERE is_public = 1 ORDER BY name'
  ).all();

  return new Response(JSON.stringify(results), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Get single buffer
async function getBuffer(id, env, corsHeaders) {
  const buffer = await env.DB.prepare(
    'SELECT * FROM buffers WHERE id = ? AND is_public = 1'
  ).bind(id).first();

  if (!buffer) {
    return new Response(JSON.stringify({ error: 'Buffer not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(buffer), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Create new buffer
async function createBuffer(request, env, corsHeaders) {
  const data = await request.json();
  const { name, content } = data;

  if (!name || !content) {
    return new Response(JSON.stringify({ error: 'Name and content required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const now = new Date().toISOString();

  // Check if buffer already exists
  const existing = await env.DB.prepare(
    'SELECT id FROM buffers WHERE id = ?'
  ).bind(id).first();

  if (existing) {
    return new Response(JSON.stringify({ error: 'Buffer already exists' }), {
      status: 409,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  await env.DB.prepare(
    'INSERT INTO buffers (id, name, content, created_at, updated_at, is_public) VALUES (?, ?, ?, ?, ?, 1)'
  ).bind(id, name, content, now, now).run();

  return new Response(JSON.stringify({ id, name, created_at: now }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Update buffer
async function updateBuffer(id, request, env, corsHeaders) {
  const data = await request.json();
  const { content } = data;

  if (!content) {
    return new Response(JSON.stringify({ error: 'Content required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const now = new Date().toISOString();

  const result = await env.DB.prepare(
    'UPDATE buffers SET content = ?, updated_at = ? WHERE id = ? AND is_public = 1'
  ).bind(content, now, id).run();

  if (result.meta.changes === 0) {
    return new Response(JSON.stringify({ error: 'Buffer not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ id, updated_at: now }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Delete buffer
async function deleteBuffer(id, env, corsHeaders) {
  // Don't allow deleting built-in buffers
  const builtIn = ['home', 'research', 'philosophy', 'projects', 'espanol', 'writings', 'contact', 'scratch'];
  if (builtIn.includes(id)) {
    return new Response(JSON.stringify({ error: 'Cannot delete built-in buffers' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const result = await env.DB.prepare(
    'DELETE FROM buffers WHERE id = ?'
  ).bind(id).run();

  if (result.meta.changes === 0) {
    return new Response(JSON.stringify({ error: 'Buffer not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ deleted: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
