// lib/auth.js - JWT 工具函数（使用 jose，兼容 Edge Runtime）
import { SignJWT, jwtVerify } from 'jose';

const getSecret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET || 'dev_secret_change_me');

const expiresIn = () => process.env.JWT_EXPIRES_IN || '7d';

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn())
    .sign(getSecret());
}

export async function verifyToken(token) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload;
}

/** 从 Request Headers 中提取并验证 JWT，返回 payload 或 null */
export async function getAuthUser(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return await verifyToken(authHeader.slice(7));
  } catch {
    return null;
  }
}

/** 返回标准 401 响应 */
export function unauthorized() {
  return Response.json({ error: '未登录，请先登录' }, { status: 401 });
}

/** 返回标准 403 响应 */
export function forbidden() {
  return Response.json({ error: '权限不足' }, { status: 403 });
}
