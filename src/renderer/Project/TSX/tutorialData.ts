// Global types for the tutorial system
export type TutorialStep = {
  description: string;
  targetElementId: string;
  position: 'left' | 'right' | 'up' | 'down';
  requiresInteraction?: boolean;
  requiresInteractionInput?: boolean;
  allowBack: boolean;
  additionalZIndexElements?: string[];
  dontInteract?: boolean;
  isJsId?: boolean;
  checkUnderElementId?: string;
  checkUnderElementIsJS?: boolean;
  whenClickedGoNextStep?: boolean;
  toContinueVarHasToBeAvailable?: string;
  marginInDirection?: number;
  blinkAsWellId?: string;
};

export type TutorialSection = {
  mainTitle: string;
  description: string;
  steps: TutorialStep[];
};

export type TutorialPage = {
  pageTitle: string;
  overview: TutorialSection;
  hasToBeIn: string;
  sections: TutorialSection[];
  autoNext?: boolean;
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
      pageTitle: 'Dashboard',
      hasToBeIn: 'dashboard',
      overview: {
        mainTitle: 'Dashboard Overview',
        description:
          'Learn about the key features and widgets on your dashboard',
        steps: [
          {
            description:
              'Welcome to your dashboard! Here you can monitor all aspects of your property management.',
            targetElementId: 'DashboardWigetMainContainer',
            position: 'right',
            allowBack: true,
          },
          {
            description:
              'View a comprehensive summary of all your rooms, including occupancy rates and room status distribution.',
            targetElementId: 'DashbRoomSummary',
            position: 'right',
            allowBack: true,
          },
          {
            description:
              'Track your total collected rent payments and compare them with expected collections over time.',
            targetElementId: 'DashbTotalCollected',
            position: 'right',
            allowBack: true,
          },
          {
            description:
              'Review historical payment records and upcoming payments for the next 10 days.',
            targetElementId: 'DashbPastPayments',
            position: 'left',
            allowBack: true,
          },
          {
            description:
              "Analyze your property's performance by viewing revenue generated per square meter.",
            targetElementId: 'DashbRevenuePerSquareFoot',
            position: 'right',
            allowBack: true,
          },
          {
            description:
              'Identify your best-performing units, brokers, and most loyal tenants.',
            targetElementId: 'TopPerformingUnits',
            position: 'left',
            allowBack: true,
          },
          {
            description:
              'Monitor tenant acquisition and retention trends over time.',
            targetElementId: 'TenantGrowthWidget',
            position: 'right',
            allowBack: true,
          },
          {
            description:
              'Track tax obligations and payments based on your rental income.',
            targetElementId: 'DashbOverAllTax',
            position: 'left',
            allowBack: true,
          },
          {
            description:
              'Stay informed about lease agreements that are approaching renewal or expiration.',
            targetElementId: 'UpcomingAgreements',
            position: 'right',
            allowBack: true,
          },
        ],
      },
      sections: [],
    },
  ],
};
