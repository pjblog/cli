import { Service } from '@zille/service';
import { QuestionCollection } from 'inquirer';
import { QuestionServiceImplements } from './types';

interface BlogConfigsReCoverProps {
  value: boolean,
}

@Service.Injectable()
export class BlogConfigsReCoverQuestion extends Service implements QuestionServiceImplements<BlogConfigsReCoverProps> {
  public ask(value: BlogConfigsReCoverProps): QuestionCollection<BlogConfigsReCoverProps> {
    return [
      {
        type: 'confirm',
        name: 'value',
        message: '博客已安装，是否要重新安装博客？',
        default: value.value,
      }
    ]
  }
}