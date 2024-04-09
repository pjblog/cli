import Blog, { findPlugins, findPackageFile } from '@pjblog/blog';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const pkgFile = findPackageFile(__dirname);
const require = createRequire(import.meta.url);

if (!pkgFile) {
  throw new Error('PJBlog配置文件不存在');
}

const pkg = require(pkgFile);

findPlugins(Object.keys(pkg.dependencies))
  .then(dependencies => Blog(pkg.blog, dependencies))
  .catch(e => console.log(e));