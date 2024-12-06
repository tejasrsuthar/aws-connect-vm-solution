import winston, { format } from "winston";

const consoleLogger = winston.createLogger({
  level: 'info',
  format: format.combine(
    format.errors({ stack: true }),
    format.splat(),
    format.simple()
  ),
  transports: [new winston.transports.Console()],
});

export {
  consoleLogger,
};