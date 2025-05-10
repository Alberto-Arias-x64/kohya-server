export const config = {
  port: process.env.PORT || 3000,
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100
  }
}; 