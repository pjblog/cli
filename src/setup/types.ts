import type { QuestionCollection } from 'inquirer';
export interface QuestionServiceImplements<T> {
  ask(value: T): QuestionCollection<T>;
}