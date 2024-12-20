// Global types for the tutorial system
export type TutorialStep = {
  description: string;
  targetElementId: string;
  position: 'left' | 'right' | 'up' | 'down';
  requiresInteraction: boolean;
  allowBack: boolean;
  additionalZIndexElements?: string[];
  dontInteract?: boolean;
};

export type TutorialSection = {
  mainTitle: string;
  description: string;
  steps: TutorialStep[];
};

export type TutorialPage = {
  pageTitle: string;
  overview: TutorialSection;
  sections: TutorialSection[];
};

export type TutorialSystem = {
  title: string;
  pages: TutorialPage[];
};

// Tutorial data
export const tutorialData: TutorialSystem = {
  title: 'BMS Tutorial',
  pages: [
    {
      pageTitle: 'Property Management',
      overview: {
        mainTitle: 'Property Management Overview',
        description: 'Learn about how to manage multiple properties.',
        steps: [
          {
            description:
              'Welcome to the Property Manager! This is where you will be managing properties',
            targetElementId: 'Property-Management-Title',
            position: 'down',
            requiresInteraction: false,
            allowBack: true,
          },
          {
            description: 'Click the refresh button to refresh',
            targetElementId: 'property-refresh-btn',
            position: 'down',
            requiresInteraction: false,
           
            allowBack: true,
          },
          {
            description:
              'Click the add property button to add a property to mange rooms',
            targetElementId: 'property-add-btn',
            position: 'down',
            dontInteract: true,
            requiresInteraction: false,
            allowBack: true,
          },
        ],
      },
      sections: [
        {
          mainTitle: 'Room Management',
          description: 'Learn how to manage your rooms effectively',
          steps: [
            {
              description: 'View all your rooms here',
              targetElementId: 'rooms-list',
              position: 'right',
              requiresInteraction: false,
              allowBack: true,
            },
          ],
        },
        // Add more sections as needed
      ],
    },
    // Add more pages as needed
  ],
};
