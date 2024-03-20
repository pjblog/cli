import { Service } from '@zille/service';
import { QuestionCollection } from 'inquirer';
import { QuestionServiceImplements } from './types';

export interface BlogAdminProps {
  account: string,
  password: string,
}


const rules: [((v: string) => boolean), string][] = [
  [v => v.length >= 8, '密码长度必须大于等于8个字符'],
  [v => /[0-9]/.test(v), '密码必须包含数字'],
  [v => /[A-Z]/.test(v), '密码必须包含大写字母'],
  [v => /[^A-Za-z0-9]/.test(v), '密码必须包含特殊字符'],
]

@Service.Injectable()
export class BlogAdminQuestion extends Service implements QuestionServiceImplements<BlogAdminProps> {
  public ask(value: BlogAdminProps): QuestionCollection<BlogAdminProps> {
    return [
      {
        type: 'input',
        name: 'account',
        message: '管理员账号',
        default: value.account,
      },
      {
        type: 'input',
        name: 'password',
        message: '管理员密码',
        default: value.password,
        validate(val: string) {
          for (let i = 0; i < rules.length; i++) {
            const [check, message] = rules[i];
            if (!check(val)) return message;
          }
          return true;
        },
      },
    ]
  }
}