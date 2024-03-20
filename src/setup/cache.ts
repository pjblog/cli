import { Service } from '@zille/service';
import { QuestionCollection } from 'inquirer';
import { QuestionServiceImplements } from './types';

interface BlogCacheTypeProps {
  value: 'file' | 'redis',
}

interface BlogCacheDirectoryProps {
  value: string,
}

@Service.Injectable()
export class BlogCacheTypeQuestion extends Service implements QuestionServiceImplements<BlogCacheTypeProps> {
  public ask(value: BlogCacheTypeProps): QuestionCollection<BlogCacheTypeProps> {
    return [
      {
        type: 'list',
        name: 'value',
        message: '缓存容器',
        default: value.value,
        choices: [
          {
            name: '文件缓存',
            value: 'file'
          },
          {
            name: 'Redis缓存',
            value: 'redis'
          }
        ]
      }
    ]
  }
}

@Service.Injectable()
export class BlogCacheDirectoryQuestion extends Service implements QuestionServiceImplements<BlogCacheDirectoryProps> {
  public ask(value: BlogCacheDirectoryProps): QuestionCollection<BlogCacheDirectoryProps> {
    return [
      {
        type: 'input',
        name: 'value',
        message: '缓存存放文件夹名称',
        default: value.value,
        validate(val: string) {
          if (!val) return '请输入文件夹名称';
          return true;
        }
      }
    ]
  }
}