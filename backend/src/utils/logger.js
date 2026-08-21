import winston from "winston";

/**
 * Winston logger configuration
 * Provides structured logging with different log levels
 */

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...args } = info;
    const ts = timestamp?.slice(0, 19).replace("T", " ");
    return `${ts} [${level}]: ${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ""}`;
  }),
);

const transports = [
  // Console transport
  new winston.transports.Console(),
  // Error log file
  new winston.transports.File({
    filename: "logs/error.log",
    level: "error",
  }),
  // All logs file
  new winston.transports.File({
    filename: "logs/all.log",
  }),
];

const logger = winston.createLogger({
  level:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === "production" ? "warn" : "debug"),
  levels,
  format,
  transports,
});

export default logger;
