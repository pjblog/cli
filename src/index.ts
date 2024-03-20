#!/usr/bin/env node

import { createRequire } from 'node:module';
import { Command } from 'commander';
import { BlogSetup } from './setup/index';
import { createContext } from '@zille/service';
import { logger } from './logger';

const require = createRequire(import.meta.url);
const program = new Command();
const pkg = require('../package.json');

program
  .name(pkg.name)
  .description(pkg.description)
  // .option('-v, --version', 'Pjblog version')
  .version(pkg.version);

program
  .command('setup [dir]')
  .description('安装博客程序')
  .action(async (dir: string) => {
    const store = createContext();
    const blog = await store.connect(BlogSetup);
    const manifest = await blog.main(dir);
    await blog.destroy();
    logger.info(`+ PJBlog@${manifest.version}`);
  })

program.parseAsync();