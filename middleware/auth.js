import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function verifyToken(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { valid: false, error: 'No token provided' };
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return { valid: false, error: 'No token provided' };
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, user: decoded };
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { valid: false, error: 'Token expired' };
    } else if (error.name === 'JsonWebTokenError') {
      return { valid: false, error: 'Invalid token' };
    } else {
      return { valid: false, error: 'Token verification failed' };
    }
  }
}

export function requireAuth(handler) {
  return async (request, context) => {
    const verification = verifyToken(request);
    
    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error },
        { status: 401 }
      );
    }
    
    // Add user info to request context
    request.user = verification.user;
    
    return handler(request, context);
  };
}

export function requireRole(roles) {
  return (handler) => {
    return async (request, context) => {
      const verification = verifyToken(request);
      
      if (!verification.valid) {
        return NextResponse.json(
          { error: verification.error },
          { status: 401 }
        );
      }
      
      if (!roles.includes(verification.user.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
      
      request.user = verification.user;
      
      return handler(request, context);
    };
  };
}

export function rateLimit(maxRequests = 100, windowMs = 60000) {
  const requests = new Map();
  
  return (handler) => {
    return async (request, context) => {
      const clientId = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
      
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Clean old requests
      for (const [client, clientRequests] of requests.entries()) {
        requests.set(client, clientRequests.filter(time => time > windowStart));
        if (requests.get(client).length === 0) {
          requests.delete(client);
        }
      }
      
      // Check current client requests
      if (!requests.has(clientId)) {
        requests.set(clientId, []);
      }
      
      const clientRequests = requests.get(clientId);
      
      if (clientRequests.length >= maxRequests) {
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429 }
        );
      }
      
      clientRequests.push(now);
      
      return handler(request, context);
    };
  };
}
