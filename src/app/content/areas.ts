export interface Area {
  readonly id: string;
  readonly name: string;
  readonly emoji: string;
  readonly colour: string;
  readonly levelCount: number;
}

export const AREAS: readonly Area[] = [
  {
    id: 'english',
    name: 'English',
    emoji: '🔤',
    colour: '#8ecbff',
    levelCount: 4,
  },
  {
    id: 'numbers',
    name: 'Numbers',
    emoji: '🔢',
    colour: '#ffb347',
    levelCount: 3,
  },
  {
    id: 'concepts',
    name: 'Concepts',
    emoji: '🔺',
    colour: '#c9a7f5',
    levelCount: 4,
  },
  {
    id: 'awareness',
    name: 'General awareness',
    emoji: '🌍',
    colour: '#9be3a4',
    levelCount: 3,
  },
];

export function areaById(id: string): Area | undefined {
  return AREAS.find((area) => area.id === id);
}
