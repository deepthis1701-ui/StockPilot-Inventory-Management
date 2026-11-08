const positiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const config = Object.freeze({
  port: positiveInt(process.env.PORT, 5000),
  mlApiUrl: (process.env.ML_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, ''),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development'
});
