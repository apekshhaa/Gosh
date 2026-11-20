import 'dotenv/config';

process.env.NODE_ENV = 'test';
process.env.PORT = '4000';
process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:27017/gosh_marketplace_test';
process.env.JWT_SECRET = 'test-only-secret-with-at-least-thirty-two-characters';
process.env.CLIENT_ORIGIN = 'http://localhost:3000';
process.env.COOKIE_SECURE = 'false';
