import { Category, PM, Status } from './types';

export const pms: PM[] = [
  { id: 1, name: 'Ирина Петрова' },
  { id: 2, name: 'Alex Chen' },
  { id: 3, name: 'Мария Смирнова' }
];

const progressByStatus: Record<Status, number> = {
  todo: 0,
  blocked: 0,
  in_progress: 0.5,
  done: 1
};

const buildProgress = (status: Status, inProgressCoeff = 0.5) => {
  if (status === 'done') return 1;
  if (status === 'in_progress') return inProgressCoeff;
  return 0;
};

export const categories: Category[] = [
  {
    id: 1,
    name: 'Техника для кухни',
    projects: [
      {
        id: 101,
        name: 'Духовой шкаф H-series',
        code: 'H-OVEN-01',
        status: 'Active',
        owner: 1,
        startDate: '2024-01-15',
        targetDate: '2024-08-30',
        description: 'Новая линейка духовок с паровым режимом.',
        moq: 500,
        basePrice: 350,
        retailPrice: 499,
        progress: 42,
        coverUrl: '',
        mediaFolder: 'workspace/media/ovens',
        inProgressCoeff: 0.45,
        steps: [
          {
            id: 1001,
            name: 'Дизайн корпуса',
            description: 'Форм-фактор, материалы, цветовые решения.',
            status: 'in_progress',
            assignee: 2,
            startDate: '2024-02-01',
            dueDate: '2024-03-15',
            completedDate: undefined,
            weight: 1,
            orderIndex: 1,
            comments: 'Уточнить доступность поставщика стекла.',
            subtasks: [
              {
                id: 2001,
                name: 'Рендеры лицевой панели',
                status: 'done',
                assignee: 2,
                targetDate: '2024-02-10',
                weight: 1,
                orderIndex: 1,
                comment: ''
              },
              {
                id: 2002,
                name: 'Тест материалов ручек',
                status: 'in_progress',
                assignee: 3,
                targetDate: '2024-03-01',
                weight: 1,
                orderIndex: 2,
                comment: 'Проверить устойчивость к царапинам.'
              }
            ],
            progress: Math.round(
              ((progressByStatus['done'] * 1 + progressByStatus['in_progress'] * 1) / 2) * 100
            )
          },
          {
            id: 1002,
            name: 'Сертификация',
            description: 'Документация и испытания.',
            status: 'todo',
            assignee: 1,
            startDate: '2024-04-01',
            dueDate: '2024-06-01',
            weight: 1,
            orderIndex: 2,
            comments: 'Готовим список лабораторий.',
            subtasks: [],
            progress: buildProgress('todo', 0.45) * 100
          }
        ]
      }
    ]
  },
  {
    id: 2,
    name: 'Климатическая техника',
    projects: [
      {
        id: 201,
        name: 'Серия кондиционеров Breeze',
        code: 'BR-COOL-02',
        status: 'Archived',
        owner: 3,
        startDate: '2023-05-01',
        targetDate: '2024-02-15',
        description: 'Обновление линейки с улучшенной энергоэффективностью.',
        moq: 800,
        basePrice: 420,
        retailPrice: 599,
        progress: 78,
        inProgressCoeff: 0.6,
        steps: [
          {
            id: 1101,
            name: 'Локализация UI',
            status: 'done',
            assignee: 1,
            startDate: '2023-06-01',
            dueDate: '2023-07-01',
            completedDate: '2023-06-28',
            orderIndex: 1,
            comments: 'Все регионы покрыты.',
            subtasks: [],
            progress: 100
          },
          {
            id: 1102,
            name: 'Тестирование',
            status: 'in_progress',
            assignee: 2,
            startDate: '2023-08-01',
            dueDate: '2023-09-15',
            orderIndex: 2,
            comments: 'Остались климатические стенды.',
            subtasks: [
              {
                id: 2101,
                name: 'Нагрузочные тесты',
                status: 'blocked',
                assignee: 2,
                targetDate: '2023-09-01',
                weight: 1,
                orderIndex: 1,
                comment: 'Нет стенда пока.'
              },
              {
                id: 2102,
                name: 'Шумовые испытания',
                status: 'in_progress',
                assignee: 2,
                targetDate: '2023-08-20',
                weight: 1,
                orderIndex: 2,
                comment: 'Нужен обновлённый микрофон.'
              }
            ],
            progress: Math.round(((buildProgress('blocked') + buildProgress('in_progress', 0.6)) / 2) * 100)
          }
        ]
      }
    ]
  }
];
