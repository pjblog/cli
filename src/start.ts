import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { logger } from './logger';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
export async function BlogStart(file: string = 'package.json') {
  const cwd = process.cwd();
  const filepath = resolve(cwd, file);
  if (!existsSync(filepath)) {
    return logger.error('找不到博客启动配置文件')
  }
  const pkg = require(filepath);
  if (!pkg?.blog || !pkg?.dependencies) {
    return logger.error('博客配置文件不合法')
  }

  const mainModulePath = require.resolve('@pjblog/blog');
  const { default: Blog } = await import(mainModulePath);
  const dependencies = findPlugins(Object.keys(pkg.dependencies));
  await Blog(pkg.blog, dependencies);
}

async function findPlugins(dependencies: string[]) {
  const plugin: any[] = [];
  for (let i = 0; i < dependencies.length; i++) {
    const dependency = dependencies[i];
    if (matchTheme(dependency) || matchPlugin(dependency)) {
      const path = require.resolve(dependency);
      const { default: Plugin } = await import(path);
      plugin.push(Plugin);
    }
  }
  return plugin;
}

function matchTheme(name: string) {
  return name.startsWith('pjblog-theme-');
}

function matchPlugin(name: string) {
  return name.startsWith('pjblog-plugin-');
}