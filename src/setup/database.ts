import { BlogCategoryEntity, BlogDataBaseProps, BlogMediaArticleEntity, BlogMediaEntity, BlogUserEntity, DataBaseConnection } from '@pjblog/blog';
import { Service } from '@zille/service';
import { QuestionCollection } from 'inquirer';
import { QuestionServiceImplements } from './types';
import { BlogAdminProps } from './admin';

const text = `在这个充满信息的时代，个人博客依旧是展示自己、分享知识和与他人交流的重要方式。无论你来自哪里，有着怎样的背景和信仰，只要你愿意分享你的故事和想法，博客依旧是最具特色的个人名片。

我们提供简洁易用的编辑器，让你沉浸写作体验。借助先进的技术，我们对 PJBlog 插件系统进行了全新设计，为你的博客增添活力。

我们相信，正是有你不同的声音和观点，才能让世界变得更加有趣和有意义。再次感谢你的到来，希望你可以在写作中度过愉快的时光！

让我们开始这段精彩的旅程吧！`;

@Service.Injectable()
export class BlogDataBaseQuestion extends Service implements QuestionServiceImplements<BlogDataBaseProps> {
  public ask(value: BlogDataBaseProps): QuestionCollection<BlogDataBaseProps> {
    return [
      {
        type: 'list',
        name: 'type',
        message: '数据库类型',
        default: value.type,
        choices: [
          { name: 'MySQL', value: 'mysql' },
          { name: 'MsSQL', value: 'mssql' },
          { name: 'Oracle', value: 'oracle' },
          { name: 'PostGres', value: 'postgres' }
        ]
      },
      {
        type: 'input',
        name: 'host',
        message: '数据库地址',
        default: value.host,
      },
      {
        type: 'input',
        name: 'port',
        message: '数据库端口',
        default: value.port,
        transformer(val: string) {
          return val ? Number(val) : 3306;
        }
      },
      {
        type: 'input',
        name: 'database',
        message: '数据库名称',
        default: value.database
      },
      {
        type: 'input',
        name: 'username',
        message: '数据库用户名',
        default: value.username,
      },
      {
        type: 'input',
        name: 'password',
        message: '数据库密码',
        default: value.password,
      },
      {
        type: 'input',
        name: 'entityPrefix',
        message: '数据库表前缀',
        default: value.entityPrefix,
      },
    ]
  }

  private async createAdmin(conn: DataBaseConnection, admin: BlogAdminProps) {
    const UserRepo = conn.manager.getRepository(BlogUserEntity);
    const user = await UserRepo.findOneBy({
      account: admin.account,
    })

    if (user) {
      return await UserRepo.save(
        user
          .updatePassword(admin.password)
          .updateAdmin(true)
          .updateForbiden(false)
      );
    }

    return await UserRepo.save(
      UserRepo
        .create()
        .add(admin.account, admin.password)
        .updateAdmin(true)
    );
  }

  private async createCategories(conn: DataBaseConnection) {
    const Category = conn.manager.getRepository(BlogCategoryEntity);
    const home = await Category.findOneBy({
      cate_outable: true,
      cate_outlink: '/'
    });

    if (!home) {
      await Category.save(Category.create().add('Home', '/'))
    }

    let category = await Category.findOneBy({
      cate_outable: false,
    })

    if (!category) {
      category = await Category.save(Category.create().add('默认分类'));
    }

    return category;
  }

  private async createArticle(conn: DataBaseConnection, category: number, user: number) {
    const Media = conn.manager.getRepository(BlogMediaEntity);
    const Article = conn.manager.getRepository(BlogMediaArticleEntity);

    const count = await Media.countBy({
      media_type: 'article'
    });
    if (!count) {
      const media = await Media.save(Media.create().add({
        title: '欢迎使用 PJBlog Geek',
        category,
        description: text,
        uid: user,
        type: 'article'
      }));
      await Article.save(Article.create().add(media.id, text, []));
    }
  }

  public async execute(conn: DataBaseConnection, extras: BlogAdminProps) {
    const admin = await this.createAdmin(conn, extras);
    const category = await this.createCategories(conn);
    await this.createArticle(conn, category.id, admin.id);
  }
}