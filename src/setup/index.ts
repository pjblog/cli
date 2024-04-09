import fs from 'fs-extra';
import { copy } from 'fs-extra';
import { Service } from '@zille/service';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPromptModule } from 'inquirer';
import { BlogDataBaseQuestion } from './database';
import { existsSync, writeFileSync } from 'node:fs';
import { BlogConfigsReCoverQuestion } from './recover';
import { createRequire } from 'node:module';
import { Configurator } from '@zille/configurator';
import { TypeORM } from '@zille/typeorm';
import { BlogCacheDirectoryQuestion, BlogCacheTypeQuestion } from './cache';
import { BlogRedisQuestion } from './redis';
import { IORedis } from '@zille/ioredis';
import { BlogHttpPortQuestion } from './port';
import { BlogAdminQuestion } from './admin';
import {
  BlogAttachmentEntity,
  BlogCategoryEntity,
  BlogMediaArticleEntity,
  BlogMediaCommentEntity,
  BlogMediaEntity,
  BlogMediaTagEntity,
  BlogProps,
  BlogUserEntity,
  Storage,
  version,
  description
} from '@pjblog/blog';

const { ensureDir } = fs;
const require = createRequire(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));

@Service.Injectable()
export class BlogSetup extends Service {
  @Service.Inject(BlogDataBaseQuestion)
  private readonly BlogDataBaseQuestion: BlogDataBaseQuestion;

  @Service.Inject(BlogRedisQuestion)
  private readonly BlogRedisQuestion: BlogRedisQuestion;

  @Service.Inject(BlogConfigsReCoverQuestion)
  private readonly BlogConfigsReCoverQuestion: BlogConfigsReCoverQuestion;

  @Service.Inject(BlogCacheTypeQuestion)
  private readonly BlogCacheTypeQuestion: BlogCacheTypeQuestion;

  @Service.Inject(BlogCacheDirectoryQuestion)
  private readonly BlogCacheDirectoryQuestion: BlogCacheDirectoryQuestion;

  @Service.Inject(BlogHttpPortQuestion)
  private readonly BlogHttpPortQuestion: BlogHttpPortQuestion;

  @Service.Inject(BlogAdminQuestion)
  private readonly BlogAdminQuestion: BlogAdminQuestion;

  @Service.Inject(Configurator)
  private readonly Configurator: Configurator;

  public readonly rollbacks: (() => void | Promise<void>)[] = []

  public async connect(dir?: string) {
    const cwd = process.cwd();
    const directory = dir ? resolve(cwd, dir) : cwd;
    const prompt = createPromptModule();

    const blogPackageJsonFilePath = resolve(directory, 'package.json');
    const exists = existsSync(blogPackageJsonFilePath);

    let configs: BlogProps = createDefaultConfigs();
    let pkg: any;

    if (exists) {
      const recoverable = await prompt(this.BlogConfigsReCoverQuestion.ask({ value: false }));
      if (!recoverable.value) {
        throw new Error('博客已安装，用户取消覆盖安装计划！');
      }
      pkg = require(resolve(directory, 'package.json'));
      if (pkg.blog) {
        configs = pkg.blog;
      }
    } else {
      await ensureDir(directory);
      pkg = {
        name: 'pjblog',
        version,
        description,
        blog: configs,
        scripts: {
          'start': 'node index.mjs',
          'pm2:start': 'pm2 start index.mjs --name=pjblog',
          'pm2:stop': 'pm2 stop pjblog',
          'pm2:restart': 'pm2 restart pjblog',
        },
        dependencies: {
          '@pjblog/blog': '^' + version,
          'pjblog-theme-default': '^2.3.0',
          'mysql2': '^3.6.1',
          'pm2': '^5.3.1'
        }
      }
      writeFileSync(blogPackageJsonFilePath, JSON.stringify(pkg, null, 2), 'utf8');
    }

    configs.database = await prompt(this.BlogDataBaseQuestion.ask(configs.database));
    this.Configurator.set(TypeORM.namespace, {
      ...configs.database,
      entities: [
        BlogUserEntity,
        BlogCategoryEntity,
        BlogMediaEntity,
        BlogMediaArticleEntity,
        BlogMediaTagEntity,
        BlogAttachmentEntity,
        BlogMediaCommentEntity,
      ],
      synchronize: true,
      logging: false,
    });
    const database = await this.$use(TypeORM);
    this.rollbacks.push(() => database.connection.destroy());

    const cacheType = await prompt(this.BlogCacheTypeQuestion.ask({ value: configs.cache.type }));
    switch (cacheType.value) {
      case 'file':
        const cacheFileDirectory = await prompt(this.BlogCacheDirectoryQuestion.ask({ value: configs.cache.directory }));
        const _cacheFileDirectory = resolve(directory, cacheFileDirectory.value);
        await ensureDir(_cacheFileDirectory);
        configs.cache = {
          type: 'file',
          directory: _cacheFileDirectory,
        }
        break;
      case 'redis':
        const redisProps = await prompt(this.BlogRedisQuestion.ask(configs.redis));
        configs.cache = {
          type: 'redis',
        }
        configs.redis = redisProps;
        break;
      default: throw new Error('未知的缓存类型');
    }

    this.Configurator.set(Storage.namespace, configs.cache);
    this.Configurator.set(IORedis.namespace, configs.redis);
    const cache = await this.$use(Storage);
    this.rollbacks.push(() => cache.connection.close());

    const portProps = await prompt(this.BlogHttpPortQuestion.ask({ value: configs.http.port.toString() }));
    configs.http.port = Number(portProps.value) || 3000;

    const admin = await prompt(this.BlogAdminQuestion.ask({ account: 'admin', password: 'Admin_888' }));

    await database.transaction((runner) => {
      return this.BlogDataBaseQuestion.execute(runner, admin);
    })

    const manifest = {
      ...pkg,
      blog: configs,
    }

    const bootstrapFile = resolve(__dirname, '../bootstrap.js');
    if (existsSync(bootstrapFile)) {
      const source = bootstrapFile;
      const target = resolve(cwd, 'index.mjs');
      await copy(source, target, { overwrite: true });
      console.log('+', 'index.mjs');
    }

    writeFileSync(blogPackageJsonFilePath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log('+', 'package.json');

    return manifest;
  }

  public async disconnect() {
    for (let i = 0; i < this.rollbacks.length; i++) {
      await Promise.resolve(this.rollbacks[i]());
    }
  }
}

function createDefaultConfigs(): BlogProps {
  return {
    http: {
      port: 3000,
    },
    cache: {
      type: 'file',
      directory: 'cache'
    },
    database: {
      "type": "mysql",
      "host": "127.0.0.1",
      "port": 3306,
      "username": "root",
      "password": "",
      "database": "blog",
      "entityPrefix": "pjblog_"
    },
    redis: {
      host: '127.0.0.1',
      port: 6379,
    }
  }
}