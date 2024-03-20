import { Service } from '@zille/service';
import { QuestionCollection } from 'inquirer';
import { QuestionServiceImplements } from './types';
import { BlogRedisProps } from '@pjblog/blog';

@Service.Injectable()
export class BlogRedisQuestion extends Service implements QuestionServiceImplements<BlogRedisProps> {
  public ask(value: BlogRedisProps): QuestionCollection<BlogRedisProps> {
    return [
      {
        type: 'input',
        name: 'host',
        message: 'Redis Host',
        default: value.host,
      },
      {
        type: 'input',
        name: 'port',
        message: 'Redis Port',
        default: value.port,
        transformer(val: string) {
          return val ? Number(val) : 6379
        }
      },
      {
        type: 'input',
        name: 'password',
        message: 'Redis Password',
        default: value.password,
      },
      {
        type: 'input',
        name: 'db',
        message: 'Redis DB channel:',
        default: value.db,
        transformer(val: string) {
          return val ? Number(val) : 0;
        }
      }
    ]
  }
}