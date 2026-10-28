/** Parent mode: not one of AREAS, so it has no levels or stars and stays out of the Mock Test. */
export const ORAL = {
  id: 'oral',
  name: 'Oral',
  emoji: '🗣️',
  colour: '#7fd8cf',
} as const;

export interface OralPrompt {
  readonly id: string;
  /** How the prompt reads in the weak-spot list. */
  readonly name: string;
  readonly section: string;
  readonly text: string;
  readonly spoken: string;
  readonly scene?: readonly string[];
}

export const ORAL_PROMPTS: readonly OralPrompt[] = [
  {
    id: 'oral:name',
    name: 'name',
    section: 'About me',
    text: 'What is your name?',
    spoken: 'What is your name?',
  },
  {
    id: 'oral:age',
    name: 'age',
    section: 'About me',
    text: 'How old are you?',
    spoken: 'How old are you?',
  },
  {
    id: 'oral:mother',
    name: "mother's name",
    section: 'About me',
    text: "What is your mother's name?",
    spoken: "What is your mother's name?",
  },
  {
    id: 'oral:father',
    name: "father's name",
    section: 'About me',
    text: "What is your father's name?",
    spoken: "What is your father's name?",
  },
  {
    id: 'oral:home',
    name: 'where he lives',
    section: 'About me',
    text: 'Where do you live?',
    spoken: 'Where do you live?',
  },
  {
    id: 'oral:rhyme',
    name: 'a rhyme',
    section: 'Recitation',
    text: 'Say a rhyme',
    spoken: 'Can you say a rhyme?',
  },
  {
    id: 'oral:count',
    name: 'counting 1 to 20',
    section: 'Recitation',
    text: 'Count 1 to 20',
    spoken: 'Count from 1 to 20.',
  },
  {
    id: 'oral:alphabet',
    name: 'A to Z',
    section: 'Recitation',
    text: 'Say A to Z',
    spoken: 'Say the letters from A to Z.',
  },
  {
    id: 'oral:picture',
    name: 'describing a picture',
    section: 'Describe a picture',
    text: 'What do you see?',
    spoken: 'Look at the picture. What do you see?',
    scene: ['🌳', '🏠', '☀️', '🐕', '👦'],
  },
  {
    id: 'oral:colour',
    name: 'favourite colour',
    section: 'Favourites',
    text: 'What is your favourite colour?',
    spoken: 'What is your favourite colour?',
  },
  {
    id: 'oral:fruit',
    name: 'favourite fruit',
    section: 'Favourites',
    text: 'What is your favourite fruit?',
    spoken: 'What is your favourite fruit?',
  },
  {
    id: 'oral:animal',
    name: 'favourite animal',
    section: 'Favourites',
    text: 'What is your favourite animal?',
    spoken: 'What is your favourite animal?',
  },
  {
    id: 'oral:toothbrush',
    name: 'toothbrush',
    section: 'Everyday questions',
    text: 'What do you do with your toothbrush?',
    spoken: 'What do you do with your toothbrush?',
  },
  {
    id: 'oral:moo',
    name: 'animal that says moo',
    section: 'Everyday questions',
    text: 'Which animal says moo?',
    spoken: 'Which animal says moo?',
  },
];
