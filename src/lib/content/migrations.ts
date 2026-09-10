export type MigrationStatus = 'ready' | 'planned';

export interface ContentMigrationPlan {
  id: string;
  title: string;
  status: MigrationStatus;
  destructive: boolean;
  description: string;
  steps: string[];
}

export const contentMigrationPlan: ContentMigrationPlan[] = [
  {
    id: '2026-09-04-content-taxonomy-baseline',
    title: 'Content taxonomy baseline',
    status: 'ready',
    destructive: false,
    description: 'Create the shared content catalog shape without changing the current UI or replacing existing screen-local demo data.',
    steps: [
      'Create taxonomy collections for exam, version, skills, task types, subskills, topics, levels, content types, and content tags.',
      'Seed a TOEFL Current catalog path that can resolve a video lesson, a practice set, and a mini test from the same taxonomy branch.',
      'Validate slugs, references, premium flags, inactive filtering, and ordering before connecting UI adapters.',
    ],
  },
  {
    id: '2026-09-04-ui-data-adapter-followup',
    title: 'UI data adapter follow-up',
    status: 'planned',
    destructive: false,
    description: 'Future phase for gradually mapping existing student screens to the shared content catalog.',
    steps: [
      'Keep current screen data as the rendered baseline until each page receives a dedicated adapter.',
      'Replace duplicated demo islands only behind stable page-level selectors.',
      'Gate premium/free states through entitlements and feature config instead of component-local booleans.',
    ],
  },
];
