import signale, { Signale } from 'signale';
import { name } from '../package.json';

export class Logger {
  private static prefix = name
  // 框架开发环境下打印时使用该logger
  private static debugLogger: typeof signale = new Signale({
    scope: Logger.prefix,
    types: {
      debug: {
        badge: '',
        label: 'debug',
        color: 'green',
      },
    },
  });
  // 用于正式环境下的信息打印，一般是warn,error之类
  private static logger: typeof signale = new Signale({
    scope: Logger.prefix,
    types: {
      warn: {
        badge: '',
        label: 'warn',
        color: 'yellow',
      },
      error: {
        badge: '',
        label: 'error',
        color: 'red',
      },
    },
  });

  static setDebugLabel(label: string) {
    Logger.debugLogger = Logger.debugLogger.scope(Logger.prefix,label);
  }
  static clearDebugLabel(label: string) {
    Logger.debugLogger = Logger.debugLogger.scope(Logger.prefix,label);
  }

  static enableDebug() {
    Logger.debugLogger.enable();
  }
  static disableDebug() {
    Logger.debugLogger.disable();
  }

  static debug(...msg: any[]) {
    Logger.debugLogger.debug(...msg);
  }

  static warn(...msg: any[]) {
    Logger.logger.warn(...msg);
  }

  static error(...msg: any[]) {
    Logger.logger.error(...msg);
  }
}
