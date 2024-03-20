import { Service } from '@zille/service';
import { QuestionCollection } from 'inquirer';
import { QuestionServiceImplements } from './types';

interface BlogHttpPortProps {
  value: number,
}

@Service.Injectable()
export class BlogHttpPortQuestion extends Service implements QuestionServiceImplements<BlogHttpPortProps> {
  public ask(value: BlogHttpPortProps): QuestionCollection<BlogHttpPortProps> {
    return [
      {
        type: 'input',
        name: 'port',
        message: '服务启动端口',
        default: value.value,
        validate(val: string) {
          if (!val) return '请输入端口';
          return true;
        },
        transformer(val: string) {
          return Number(val);
        }
      }
    ]
  }
}