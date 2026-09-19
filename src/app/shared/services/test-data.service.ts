import { Service } from '@angular/core';
import { IColumn } from '../components/table/custom-table';

export interface Staffer {
  id: number;
  family: string;
  name: string;
  patronymic?: string;
  birthday: Date;
  post: string;
  age: number;
}

export interface Car {
  id: number;
  mark: string;
  model: string;
  color: string;
  type: string;
  power: number;
  length: number;
}

@Service()
export class TestDataService {
  private readonly HEADERS: Record<string, string> = {
    id: 'Код записи',
    family: 'Фамилия',
    name: 'Имя',
    patronymic: 'Отчество',
    birthday: 'Дата рождения',
    age: 'Возраст',
    post: 'Должность',
    mark: 'Марка',
    model: 'Модель',
    color: 'Цвет',
    type: 'Тип',
    power: 'Мощность',
    length: 'Длина',
  };

  staffers: Staffer[] = [
    {
      id: 1,
      family: 'Иванов',
      name: 'Иван',
      patronymic: 'Иванович',
      birthday: new Date('1980-01-01'),
      age: 46,
      post: 'Начальник отдела',
    },
    {
      id: 2,
      family: 'Петров',
      name: 'Пётр',
      patronymic: 'Петрович',
      birthday: new Date('1990-01-01'),
      age: 36,
      post: 'Ведущий инженер',
    },
    {
      id: 3,
      family: 'Андреев',
      name: 'Андрей',
      patronymic: 'Андреевич',
      birthday: new Date('2000-01-01'),
      age: 26,
      post: 'Программист',
    },
  ];

  cars: Car[] = [
    {
      id: 1,
      mark: 'Ауди',
      model: '100',
      color: 'белый',
      type: 'легковой',
      power: 120,
      length: 4700,
    },
    {
      id: 2,
      mark: 'Changan',
      model: 'UNI-K',
      color: 'серый',
      type: 'легковой',
      power: 226,
      length: 4880,
    },
  ];

  /**
   * Получение данных по заданному значению
   * @param value - заданное значение данных
   */
  getData(value: string | null) {
    if (value === null) return [];

    return value === 'Сотрудники' ? this.staffers : this.cars;
  }

  /**
   * Формирование списка столбцов по исходным данных
   * @param selectedData
   */
  getColumns(selectedData: string | null): IColumn[] | null {
    const data = this.getData(selectedData);
    if (!data || data.length === 0) return null;

    const firstItem = data[0];
    return Object.entries(firstItem).map(([field, value]): IColumn => ({
      field,
      caption: this.HEADERS[field] ?? field,
      type: this.getType(value),
    }));
  }

  /**
   * Определение типа поля по его значению
   * @param value
   * @private
   */
  private getType(value: unknown): IColumn['type'] {
    if (value instanceof Date) return 'date';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    return 'string';
  }
}
