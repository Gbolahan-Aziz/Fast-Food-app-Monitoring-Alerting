// metrics.js
import client from 'prom-client';

// Create a Registry to register the metrics
const register = new client.Registry();

// Collect default metrics (e.g., memory usage, CPU usage)
client.collectDefaultMetrics({ register });

// Create custom metrics
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.2, 0.5, 1, 1.5, 2, 5]
});

// Register the custom metrics
register.registerMetric(httpRequestDurationMicroseconds);

// Middleware to measure request duration
const metricsMiddleware = (req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on('finish', () => {
    end({ route: req.route?.path || req.path, method: req.method, status_code: res.statusCode });
  });
  next();
};

// Metrics endpoint
const metricsEndpoint = async (req, res) => {
  res.setHeader('Content-Type', register.contentType);
  res.end(await register.metrics());
};

export { metricsMiddleware, metricsEndpoint };
