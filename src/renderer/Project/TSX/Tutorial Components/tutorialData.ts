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
      pageTitle: 'Property Management',
      hasToBeIn: 'property',
      overview: {
        mainTitle: 'Property Management',
        description: 'Learn about how to manage multiple properties.',
        steps: [
          {
            description:
              'Welcome to the Property Manager! This is where you will be managing your properties.',
            targetElementId: 'Property-Management-Title',
            position: 'down',
            requiresInteraction: false,
            allowBack: true,
          },
          {
            description:
              'Here you will see buttons which will allow you to refresh and add a new property',
            targetElementId: 'Property-Management-Buttons',
            position: 'down',
            requiresInteraction: false,
            allowBack: true,
            dontInteract: true,
          },
          {
            description:
              'Here you can see the current user and switch between other users.',
            targetElementId: 'Property-Management-switchUser',
            position: 'down',
            requiresInteraction: false,
            allowBack: true,
            dontInteract: true,
          },
          {
            description: 'This is where your properties will be listed.',
            targetElementId: 'Property-Management-List',
            position: 'down',
            requiresInteraction: false,
            allowBack: true,
            dontInteract: true,
          },
        ],
      },
      sections: [],
    },
    {
      pageTitle: 'App Users',
      hasToBeIn: 'app user',
      overview: {
        mainTitle: 'App Users',
        description: 'Learn about how to manage your team with app users',
        steps: [
          {
            description:
              'Welcome to the App User Manager! This is where you will be managing your team with app users.',
            targetElementId: 'App-User-Manager-Title',
            position: 'down',
            requiresInteraction: false,
            allowBack: true,
          },
          {
            description:
              'Click this button to add a new user. You can then assign specific properties and privileges to them.',
            targetElementId: 'app-user-buttons',
            position: 'down',
            requiresInteraction: true,
            allowBack: true,
            dontInteract: false,
          },
          {
            description: 'This is the new app user you just added.',
            targetElementId: 'tutorialNewAppUserId',
            position: 'left',
            requiresInteraction: false,
            allowBack: false,
            isJsId: true,
            dontInteract: true,
          },
          {
            description: 'Enter the name or role of the app user.',
            targetElementId:
              'tutorialNewAppUserId + " app-user-edit-name-input"',
            position: 'left',
            requiresInteraction: true,
            allowBack: false,
            isJsId: true,
            dontInteract: false,
          },
          {
            description: 'When done click save',
            targetElementId:
              'tutorialNewAppUserId + " app-user-edit-name-save"',
            position: 'left',
            requiresInteraction: true,
            allowBack: true,
            whenClickedGoNextStep: true,
            isJsId: true,
            dontInteract: false,
          },
          {
            description:
              'This is edit and select buttons which allow you to edit or select the app user.',
            targetElementId: 'tutorialNewAppUserId + " app-user-edit-select"',
            position: 'left',
            requiresInteraction: false,
            allowBack: true,
            isJsId: true,
            dontInteract: true,
          },
          {
            description:
              'These are the privileges you can allow or disallow for this user.',
            targetElementId: 'tutorialNewAppUserId + " privileges-list"',
            position: 'left',
            requiresInteraction: false,
            allowBack: true,
            isJsId: true,
            dontInteract: true,
          },
          {
            description:
              'This section is for what properties this user is able to access and manage.',
            targetElementId:
              'tutorialNewAppUserId + " appuser-properties-list"',
            position: 'left',
            requiresInteraction: false,
            allowBack: true,
            isJsId: true,
            dontInteract: true,
          },
          {
            description:
              'This section allows you to enable password and username login for this user account. Anyone with the correct username and password will be able to log in.',
            targetElementId:
              'tutorialNewAppUserId + " appuser-account-password"',
            position: 'left',
            requiresInteraction: false,
            allowBack: true,
            isJsId: true,
            dontInteract: true,
          },
        ],
      },
      sections: [],
    },
    {
      pageTitle: 'Expense Page',
      hasToBeIn: 'expense',
      overview: {
        mainTitle: 'Expense Manager',
        description: 'Learn how to manage and track your expenses.',
        steps: [
          {
            description:
              'Welcome to the Expense Manager! Here you can track both recurring and one-time expenses, and also receive notifications for them.',
            targetElementId: 'expense-manager-title',
            position: 'right',
            requiresInteraction: false,
            allowBack: true,
          },
          {
            description:
              'Click this button to show or hide the filter options. So you can find expenses easier.',
            targetElementId: 'expense-filters-toggle',
            position: 'right',
            requiresInteraction: false,
            allowBack: true,
          },
          {
            description:
              'Use these filters to search and filter your expenses by various criteria.',
            targetElementId: 'expense-filters-container',
            position: 'right',
            requiresInteraction: false,
            allowBack: true,
          },
          {
            description:
              'Click on categories to filter expenses by their type.',
            targetElementId: 'expense-categories-container',
            position: 'right',
            requiresInteraction: false,
            allowBack: true,
          },
        ],
      },
      sections: [
        {
          mainTitle: 'Managing Expenses',
          description: 'Learn how to add and edit expenses',
          steps: [
            {
              description: 'Recurring expenses are shown under this section.',
              targetElementId: 'recurring-expenses-title',
              position: 'down',
              requiresInteraction: false,
              allowBack: true,
            },
            {
              description: 'One-time expenses are shown under this section.',
              targetElementId: 'one-time-expenses-title',
              position: 'down',
              requiresInteraction: false,
              allowBack: true,
            },
            {
              description: 'Click here to add a new expense.',
              targetElementId: 'add-expense-button',
              position: 'down',
              requiresInteraction: true,
              allowBack: true,
              toContinueVarHasToBeAvailable: 'tutorialNewExpenseId',
            },
            {
              description: 'Enter the name of your expense.',
              targetElementId:
                'tutorialNewExpenseId + "-expense-row-name-input"',
              position: 'right',
              requiresInteraction: true,
              allowBack: true,
              isJsId: true,
            },
            {
              description: 'Select the category for this expense.',
              targetElementId:
                'tutorialNewExpenseId + "-expense-category-select"',
              position: 'right',
              requiresInteraction: true,
              allowBack: true,
              isJsId: true,
            },
            {
              description:
                'Specify if the amount is calculated before or after tax percentage.',
              targetElementId: 'tutorialNewExpenseId + "-expense-tax-checkbox"',
              position: 'right',
              requiresInteraction: false,
              allowBack: true,
              isJsId: true,
            },
            {
              description: 'Enter the expense amount and select currency.',
              targetElementId:
                'tutorialNewExpenseId + "-expense-row-currencyPrice-select"',
              position: 'right',
              requiresInteraction: true,
              allowBack: true,
              isJsId: true,
            },
            {
              description:
                'Choose if this expense applies to the full building or specific room.',
              targetElementId:
                'tutorialNewExpenseId + "-expense-location-select"',
              position: 'right',
              requiresInteraction: true,
              allowBack: true,
              isJsId: true,
            },
            {
              description:
                'Set if this is a recurring expense and specify the recurrence pattern.',
              targetElementId:
                'tutorialNewExpenseId + "-expense-recurring-options"',
              position: 'left',
              requiresInteraction: false,
              allowBack: true,
              isJsId: true,
            },
            {
              description:
                'Set the date for the expense and if it is a recurring expense, you can set a end date.',
              targetElementId: 'tutorialNewExpenseId + "-expense-dates"',
              position: 'left',
              requiresInteraction: false,
              allowBack: true,
              isJsId: true,
            },
            {
              description: 'Configure email notifications for this expense.',
              targetElementId:
                'tutorialNewExpenseId + "-expense-notifications-button"',
              position: 'left',
              requiresInteraction: false,
              allowBack: true,
              whenClickedGoNextStep: true,
              isJsId: true,
            },
            {
              description:
                'You can send an email or a SMS to yourself, First allow email/SMS then enter the days before the expense is due, then enter the email/phone numbers, you can also send to multiple people by clicking by enter.',
              targetElementId:
                'tutorialNewExpenseId + "-expense-notifications-container"',
              position: 'left',
              requiresInteraction: false,
              allowBack: true,

              isJsId: true,
            },
            {
              description: 'Click save to complete adding the expense.',
              targetElementId:
                'tutorialNewExpenseId + "-expense-row-edit-button"',
              position: 'right',
              requiresInteraction: true,
              allowBack: true,
              whenClickedGoNextStep: true,
              isJsId: true,
            },
          ],
        },
        {
          mainTitle: 'Filtering Expenses',
          description: 'Learn how to use the filter options',
          steps: [
            {
              description: 'Search for expenses by name using this search box.',
              targetElementId: 'expense-search-input',
              position: 'right',
              requiresInteraction: false,
              allowBack: true,
            },
            {
              description: 'Filter expenses by currency and price range.',
              targetElementId: 'expense-price-filters',
              position: 'right',
              requiresInteraction: false,
              allowBack: true,
            },
            {
              description: 'Filter by building, floor, and room numbers.',
              targetElementId: 'expense-location-filters',
              position: 'right',
              requiresInteraction: false,
              allowBack: true,
            },
            {
              description: 'Filter by Tax type, if it is before or after tax.',
              targetElementId: 'expense-tax-filters',
              position: 'right',
              requiresInteraction: false,
              allowBack: true,
            },
            {
              description: 'Filter recurring expenses by their frequency.',
              targetElementId: 'expense-recurring-filters',
              position: 'right',
              requiresInteraction: false,
              allowBack: true,
            },
            {
              description:
                'Use the date filter to find expenses within a specific timeframe.',
              targetElementId: 'expense-date-filter',
              position: 'right',
              requiresInteraction: false,
              allowBack: true,
            },
          ],
        },
        {
          mainTitle: 'Calendar View',
          description: 'Learn how to use the expense calendar',
          steps: [
            {
              description: 'Click here to toggle the calendar view.',
              targetElementId: 'expense-calendar-toggle',
              position: 'down',
              requiresInteraction: true,
              allowBack: true,
            },
            {
              description:
                'The calendar shows all your expenses organized by date.',
              targetElementId: 'expense-calendar',
              position: 'left',
              requiresInteraction: false,
              allowBack: true,
            },
            {
              description:
                'You can click the left and right arrows to navigate through the months.',
              targetElementId: 'expense-calendar-navigation',
              position: 'left',
              requiresInteraction: false,
              allowBack: true,
            },
            {
              description:
                'You can hover over the dots to see the expenses details',
              targetElementId: 'expense-calendar',
              position: 'left',
              requiresInteraction: false,
              allowBack: true,
            },
          ],
        },
      ],
    },

    {
      pageTitle: 'Tools Page',
      hasToBeIn: 'tools',
      overview: {
        mainTitle: 'Tools Page',
        description: 'Learn how to manage email/SMS templates and other tools.',
        steps: [
          {
            targetElementId: 'tools-title',
            description:
              'Welcome to the Tools Page! Here you can manage email/SMS templates and other tools.',
            position: 'right',
            allowBack: true,
          },
        ],
      },
      sections: [
        {
          mainTitle: 'Email Templates',
          description: 'Manage your email notification templates.',
          steps: [
            {
              targetElementId: 'tools-email-templates-tab',
              description:
                'Click here to access email templates. These templates are used for automated notifications and communications.',
              position: 'right',
              allowBack: true,
              requiresInteraction: true,
            },
            {
              targetElementId: 'add-email-template-button',
              description:
                'Click here to create a new email template. You already have a default template, you can edit it or create a new one.',
              position: 'left',
              allowBack: true,
            },
            {
              targetElementId: 'email-template-open-button',
              description:
                'Click here to open the default template. To see the contents.',
              position: 'left',
              allowBack: true,
              requiresInteraction: true,
            },
            {
              targetElementId: 'email-template-edit-button',
              description:
                'Click here to edit the default template. To change the name, subject, body.',
              position: 'left',
              allowBack: true,
              requiresInteraction: true,
            },
            {
              targetElementId: 'email-template-name',
              description: 'Here you can edit the name of the template.',
              position: 'down',
              allowBack: true,
            },
            {
              targetElementId: 'email-template-subject',
              description: 'Here you can edit the subject of the template.',
              position: 'right',
              allowBack: true,
            },
            {
              targetElementId: 'email-template-body',
              description:
                'Here you can edit the body of the template. You can use variables like {{tenant_name}} that will be automatically replaced with actual values.',
              position: 'down',
              allowBack: true,
            },
            {
              targetElementId: 'email-variables-list',
              description:
                'Click these variables to insert them into your template. They will be replaced with actual data when the email is sent.',
              position: 'left',
              allowBack: true,
            },
            {
              targetElementId: 'try-out-email',
              description:
                'Test your template by sending a sample email to verify how it looks.',
              position: 'left',
              allowBack: true,
              dontInteract: true,
            },
          ],
        },
        {
          mainTitle: 'SMS Templates',
          description: 'Manage your SMS notification templates.',
          steps: [
            {
              targetElementId: 'tools-sms-templates-tab',
              description:
                'Click here to access SMS templates. These templates are used for automated text notifications.',
              position: 'right',
              allowBack: true,
              requiresInteraction: true,
            },
            {
              targetElementId: 'add-sms-template-button',
              description:
                'Click here to create a new SMS template. You already have a default template, you can edit it or create a new one.',
              position: 'left',
              allowBack: true,
            },
            {
              targetElementId: 'sms-template-open-button',
              description:
                'Click here to open the default template. To see the contents.',
              position: 'left',
              allowBack: true,
              requiresInteraction: true,
            },
            {
              targetElementId: 'sms-template-edit-button',
              description:
                'Click here to edit the default template. To change the name and body.',
              position: 'left',
              allowBack: true,
              requiresInteraction: true,
            },
            {
              targetElementId: 'sms-template-name',
              description: 'Here you can edit the name of the template.',
              position: 'down',
              allowBack: true,
            },
            {
              targetElementId: 'sms-template-body',
              description:
                'Write your SMS content here. Keep it concise as SMS messages have character limits. For Amharic text, 69 characters count as 1 SMS. For English text, 159 characters count as 1 SMS.',
              position: 'down',
              allowBack: true,
            },
            {
              targetElementId: 'sms-variables-list',
              description:
                'Click these variables to insert them into your template. They will be replaced with actual data when the SMS is sent.',
              position: 'left',
              allowBack: true,
            },
            {
              targetElementId: 'try-out-sms',
              description:
                'Test your template by sending a sample SMS to verify how it looks.',
              position: 'left',
              allowBack: true,
              dontInteract: true,
            },
          ],
        },
        {
          mainTitle: 'Database',
          description:
            'Learn how to use the database to view and manage your data',
          steps: [
            {
              targetElementId: 'tools-database-tab',
              description:
                'Click here to access the database tab. Here you can view all your data in records.',
              position: 'right',
              whenClickedGoNextStep: true,
              allowBack: true,
              requiresInteraction: true,
            },
            {
              description:
                'Your data is displayed in this table format. Each row represents a record, and each column represents a field of information.',
              targetElementId: 'InfoTable',
              position: 'right',
              requiresInteraction: false,
              allowBack: true,
            },
            {
              description:
                'Click any column header to filter the data by that specific field. For example, click the "name" column to filter by name.',
              targetElementId: 'InfoTableHeadTR',
              position: 'down',
              requiresInteraction: false,
              allowBack: true,
            },
            {
              description:
                'When you click a column header, this search input appears. Type your search term to filter the records.',
              targetElementId: 'searchConfig',
              position: 'down',
              requiresInteraction: false,
              allowBack: true,
            },
            {
              description:
                'For fields that reference other records (like roomId or tenantId), you\'ll see a "Go to" button. Click it to navigate to the referenced record.',
              targetElementId: 'InfoTableBodyTD',
              position: 'right',
              requiresInteraction: false,
              allowBack: true,
            },
            {
              description:
                'Select which type of data you want to view. Each table contains different types of records - for example, "rooms" shows all room data, "tenants" shows tenant information.',
              targetElementId: 'monthsFutureInput',
              position: 'down',
              requiresInteraction: false,
              allowBack: true,
            },
            {
              description:
                'Use this search box to quickly find any record. The search works across all fields in the table.',
              targetElementId: 'mainSearch',
              position: 'down',
              requiresInteraction: false,
              allowBack: true,
            },
          ],
        },
        {
          mainTitle: 'Settings',
          description:
            'Welcome to the Settings section! Here you can configure various system settings.',
          steps: [
            {
              targetElementId: 'tools-settings-tab',
              description:
                'Click here to access the settings tab where you can configure all system settings.',
              position: 'right',
              whenClickedGoNextStep: true,
              allowBack: true,
              requiresInteraction: true,
            },
            {
              targetElementId: 'tax-percentage-input',
              description:
                'Enter your tax percentage, which will be used for reports and statistics.',
              position: 'right',
              allowBack: true,
            },
            {
              targetElementId: 'tax-percentage-save',
              description: 'Click Save to apply your new tax percentage.',
              position: 'right',
              allowBack: true,
            },
            {
              targetElementId: 'room-specs-section',
              description:
                'In this section, you can define default specifications available when creating or editing rooms.',
              position: 'down',
              allowBack: true,
            },
            {
              targetElementId: 'add-room-spec-button',
              description: 'Click Add to create a new room specification.',
              position: 'down',
              allowBack: true,
              requiresInteraction: true,
            },
            {
              targetElementId: 'room-spec-name-input',
              description:
                "Enter a name for your specification (e.g., 'Balcony', 'Furnishing', 'Bedrooms',etc.).",
              position: 'down',
              allowBack: true,
            },
            {
              targetElementId: 'room-spec-type-radio',
              description:
                'Choose whether this specification is a Yes/No option or requires a number value.',
              position: 'down',
              allowBack: true,
            },
            {
              targetElementId: 'room-spec-input',
              description: 'Enter the value based on the type you selected.',
              position: 'right',
              allowBack: true,
            },
            {
              targetElementId: 'room-spec-save-button',
              description: 'Click Save to apply your new room specifications.',
              position: 'right',
              allowBack: true,
            },
            {
              targetElementId: 'default-currency-select',
              description:
                'Select your default currency for transactions. This will be used as the base currency unless specifically set for individual rooms.',
              position: 'right',
              allowBack: true,
            },
            {
              targetElementId: 'update-exchange-rate-button',
              description: 'Click to update exchange rates to latest values.',
              position: 'right',
              allowBack: true,
            },
            {
              targetElementId: 'historical-rate-date-input',
              description: 'Select a date to view historical exchange rates.',
              position: 'right',
              allowBack: true,
            },
            {
              targetElementId: 'show-recent-rates-button',
              description: 'Click to view or hide recent exchange rates.',
              position: 'right',
              allowBack: true,
            },
            {
              targetElementId: 'abbreviate-numbers-checkbox',
              description:
                'Enable to display large numbers in shortened format (e.g., 1M instead of 1,000,000).',
              position: 'right',
              allowBack: true,
            },
            {
              targetElementId: 'decimal-places-input',
              description: 'Set decimal places for abbreviated numbers.',
              position: 'right',
              allowBack: true,
            },
            {
              targetElementId: 'representativeEmails',
              description:
                'Add email addresses for notifications. Add multiple by typing and pressing Enter.',
              position: 'right',
              allowBack: true,
            },
            {
              targetElementId: 'representativePhoneNumbers',
              description:
                'Add phone numbers (minimum 10 digits) for SMS notifications.',
              position: 'right',
              allowBack: true,
            },
            {
              targetElementId: 'landlordDisplayName',
              description: 'Enter the name to show in tenant communications.',
              position: 'right',
              allowBack: true,
            },
            {
              targetElementId: 'landlordEmail',
              description: 'Enter the email address for tenant communications.',
              position: 'right',
              allowBack: true,
            },
            {
              targetElementId: 'landlordTelephone',
              description: 'Enter the phone number for tenant communications.',
              position: 'right',
              allowBack: true,
            },
          ],
        },
      ],
    },
  ],
};
