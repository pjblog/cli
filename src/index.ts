#!/usr/bin/env node

import { createRequire } from 'node:module';
import { Command } from 'commander';
import { BlogSetup } from './setup/index';
import { BlogStart } from './start';
import { createContext } from '@zille/service';
import { logger } from './logger';

const require = createRequire(import.meta.url);
const program = new Command();
const pkg = require('../package.json');

program
  .name(pkg.name)
  .description(pkg.description)
  .version(pkg.version, '-v, --version', 'Pjblog version');

program
  .command('setup [dir]')
  .description('安装博客程序')
  .action(tryCatch(async (dir: string) => {
    const store = createContext();
    const blog = await store.connect(BlogSetup);
    const manifest = await blog.connect(dir);
    await blog.disconnect();
    logger.info(`+ PJBlog@${manifest.version}`);
  }))

program
  .command('start [file]')
  .description('启动服务')
  .action(tryCatch(BlogStart));

program.parseAsync();

function tryCatch(
  callback: (...args: any[]) => Promise<unknown>,
  errHandler?: () => void | Promise<void>
) {
  return async (...args: any[]) => {
    try {
      await callback(...args);
    } catch (e) {
      logger.error(e.stack);
      errHandler && await Promise.resolve(errHandler())
    }
  }
}