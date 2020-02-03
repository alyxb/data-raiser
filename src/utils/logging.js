import bunyan from 'bunyan';

function getLevel() {
  if (process.env.NODE_ENV === 'test') {
    return bunyan.FATAL + 1;
  } else if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  }
  return 'info';
}

export default bunyan.createLogger({
  name: 'data-raiser',
  serializers: {
    err: bunyan.stdSerializers.err,
  },
  level: getLevel(),
  streams: [
    {
      stream: process.stdout,
    },
  ],
});
