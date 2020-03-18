import pino from 'pino';
export const logger = pino({
  prettyPrint: { colorize: true },
  ignore: ['level', 'time', 'pid', 'hostname', 'v'],
});
