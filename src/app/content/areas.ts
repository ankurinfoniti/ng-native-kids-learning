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
];

export function areaById(id: string): Area | undefined {
  return AREAS.find((area) => area.id === id);
}
