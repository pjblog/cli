import dayjs from 'dayjs';
import _logger from 'npmlog';

_logger.heading = 'PJBlog';

const error = (message: string, ...args: any[]) => _logger.error(createMs(), message, ...args);
const info = (message: string, ...args: any[]) => _logger.info(createMs(), message, ...args);
const warn = (message: string, ...args: any[]) => _logger.warn(createMs(), message, ...args);

const logger = {
  error,
  info,
  warn,
}

export {
  logger
}

function createMs() {
  return dayjs().format('HH:mm:ss');
}