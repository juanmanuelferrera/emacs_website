// Cloudflare Worker for Emacs Website API with Authentication

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Public routes (no auth required)
      if (url.pathname === '/api/buffers' && request.method === 'GET') {
        return await getBuffers(env, corsHeaders);
      }

      if (url.pathname.startsWith('/api/buffers/') && request.method === 'GET') {
        const id = url.pathname.split('/')[3];
        return await getBuffer(id, env, corsHeaders);
      }

      // Auth routes
      if (url.pathname === '/api/auth/register' && request.method === 'POST') {
        return await register(request, env, corsHeaders);
      }

      if (url.pathname === '/api/auth/login' && request.method === 'POST') {
        return await login(request, env, corsHeaders);
      }

      // Protected routes (auth required)
      const user = await authenticate(request, env);
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (url.pathname === '/api/buffers' && request.method === 'POST') {
        return await createBuffer(request, env, corsHeaders, user);
      }

      if (url.pathname.startsWith('/api/buffers/') && request.method === 'PUT') {
        const id = url.pathname.split('/')[3];
        return await updateBuffer(id, request, env, corsHeaders, user);
      }

      if (url.pathname.startsWith('/api/buffers/') && request.method === 'DELETE') {
        const id = url.pathname.split('/')[3];
        return await deleteBuffer(id, env, corsHeaders, user);
      }

      if (url.pathname === '/api/auth/me' && request.method === 'GET') {
        return new Response(JSON.stringify({ user: user.username }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
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

// Simple password hashing (in production, use bcrypt or similar)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Create JWT token
async function createToken(username) {
  const payload = {
    username,
    exp: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
  };
  return btoa(JSON.stringify(payload));
}

// Verify JWT token
async function verifyToken(token) {
  try {
    const payload = JSON.parse(atob(token));
    if (payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// Authenticate request
async function authenticate(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token);
  if (!payload) {
    return null;
  }

  // Verify user still exists
  const user = await env.DB.prepare(
    'SELECT username FROM users WHERE username = ?'
  ).bind(payload.username).first();

  return user;
}

// Register new user
async function register(request, env, corsHeaders) {
  const data = await request.json();
  const { username, password } = data;

  if (!username || !password) {
    return new Response(JSON.stringify({ error: 'Username and password required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (username.length < 3 || password.length < 6) {
    return new Response(JSON.stringify({ error: 'Username min 3 chars, password min 6 chars' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Check if username exists
  const existing = await env.DB.prepare(
    'SELECT username FROM users WHERE username = ?'
  ).bind(username).first();

  if (existing) {
    return new Response(JSON.stringify({ error: 'Username already taken' }), {
      status: 409,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const passwordHash = await hashPassword(password);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.DB.prepare(
    'INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)'
  ).bind(id, username, passwordHash, now).run();

  const token = await createToken(username);

  return new Response(JSON.stringify({ token, username }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Login user
async function login(request, env, corsHeaders) {
  const data = await request.json();
  const { username, password } = data;

  if (!username || !password) {
    return new Response(JSON.stringify({ error: 'Username and password required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const passwordHash = await hashPassword(password);

  const user = await env.DB.prepare(
    'SELECT username FROM users WHERE username = ? AND password_hash = ?'
  ).bind(username, passwordHash).first();

  if (!user) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const token = await createToken(username);

  return new Response(JSON.stringify({ token, username }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Get all public buffers
async function getBuffers(env, corsHeaders) {
  const { results } = await env.DB.prepare(
    'SELECT id, name, created_at, updated_at, created_by FROM buffers WHERE is_public = 1 ORDER BY name'
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

// Create new buffer (auth required)
async function createBuffer(request, env, corsHeaders, user) {
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
    'INSERT INTO buffers (id, name, content, created_at, updated_at, created_by, is_public) VALUES (?, ?, ?, ?, ?, ?, 1)'
  ).bind(id, name, content, now, now, user.username).run();

  return new Response(JSON.stringify({ id, name, created_at: now }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Update buffer (auth required)
async function updateBuffer(id, request, env, corsHeaders, user) {
  const data = await request.json();
  const { content } = data;

  if (!content) {
    return new Response(JSON.stringify({ error: 'Content required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Check if user owns this buffer or if it's editable by anyone
  const buffer = await env.DB.prepare(
    'SELECT created_by FROM buffers WHERE id = ?'
  ).bind(id).first();

  if (!buffer) {
    return new Response(JSON.stringify({ error: 'Buffer not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Allow edit if user owns it or it's a public community buffer
  const builtIn = ['home', 'research', 'philosophy', 'projects', 'espanol', 'writings', 'contact', 'scratch'];
  if (builtIn.includes(id)) {
    return new Response(JSON.stringify({ error: 'Cannot edit built-in buffers' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const now = new Date().toISOString();

  await env.DB.prepare(
    'UPDATE buffers SET content = ?, updated_at = ? WHERE id = ?'
  ).bind(content, now, id).run();

  return new Response(JSON.stringify({ id, updated_at: now }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Delete buffer (auth required)
async function deleteBuffer(id, env, corsHeaders, user) {
  // Don't allow deleting built-in buffers
  const builtIn = ['home', 'research', 'philosophy', 'projects', 'espanol', 'writings', 'contact', 'scratch'];
  if (builtIn.includes(id)) {
    return new Response(JSON.stringify({ error: 'Cannot delete built-in buffers' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Check if user owns this buffer
  const buffer = await env.DB.prepare(
    'SELECT created_by FROM buffers WHERE id = ?'
  ).bind(id).first();

  if (!buffer) {
    return new Response(JSON.stringify({ error: 'Buffer not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (buffer.created_by !== user.username) {
    return new Response(JSON.stringify({ error: 'Not authorized to delete this buffer' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  await env.DB.prepare(
    'DELETE FROM buffers WHERE id = ?'
  ).bind(id).run();

  return new Response(JSON.stringify({ deleted: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
