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
  dontShowInTryout?: boolean;
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
            dontShowInTryout: true,
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
      pageTitle: 'Room Management',
      hasToBeIn: 'rooms',
      overview: {
        mainTitle: 'Room Management',
        description:
          'Learn how to manage your rooms and view them in different ways.',
        steps: [
          {
            description:
              'Welcome to Room Management! This is where you will be managing all your rooms.',
            targetElementId: 'room-manager-title',
            position: 'right',
            requiresInteraction: false,
            allowBack: true,
          },
          {
            description:
              'Here you can search for rooms using the tenant search, room search and floor search.',
            targetElementId: 'room-search-container',
            position: 'right',
            requiresInteraction: false,
            allowBack: true,
          },
          {
            description:
              'You can filter rooms by various criteria including:\n• Room status (Taken/Empty)\n• Price with comparison operators\n• Due dates\n• Square meters\n• Currency',
            targetElementId: 'room-search-container-filters',
            position: 'right',
            requiresInteraction: false,
            allowBack: true,
          },
        ],
      },
      sections: [
        {
          mainTitle: 'Adding a Room',
          description: 'Learn how to add new rooms to your property',
          steps: [
            {
              description:
                'Click this button to add a new room to your property.',
              targetElementId: 'add-room-button',
              position: 'right',
              requiresInteraction: true,
              allowBack: true,
            },
            {
              description: 'Enter the floor number for your new room.',
              targetElementId: 'add-room-floor-input',
              position: 'right',
              requiresInteraction: true,
              allowBack: true,
            },
            {
              description: 'Enter the room number/index.',
              targetElementId: 'add-room-index-input',
              position: 'right',
              requiresInteraction: true,
              allowBack: true,
            },
            {
              description:
                'Set the room price and select currency. You can change later when adding a tenant.',
              targetElementId: 'add-room-price-container',
              position: 'right',
              requiresInteraction: true,
              allowBack: true,
            },
            {
              description:
                'Choose the payment cycle for this room. Meaning how often the rent is paid.',
              targetElementId: 'add-room-payment-cycle',
              position: 'right',
              requiresInteraction: true,
              allowBack: true,
            },
            {
              description: 'Enter the room size in square meters.',
              targetElementId: 'add-room-square-meters',
              position: 'right',
              requiresInteraction: true,
              allowBack: true,
            },

            {
              targetElementId: 'room-specs-section',
              description:
                'Here you can define room specifications like Bathrooms: 2, Furnished: yes, etc.',
              position: 'right',
              allowBack: true,
            },
            {
              targetElementId: 'add-room-spec-button',
              description: 'Click Add to create a new room specification.',
              position: 'right',
              allowBack: true,
              requiresInteraction: true,
            },
            {
              targetElementId: 'room-spec-name-input',
              description:
                "Enter a name for your specification (e.g., 'Balcony', 'Furnishing', 'Bedrooms',etc.).",
              position: 'right',
              allowBack: true,
            },
            {
              targetElementId: 'room-spec-type-radio',
              description:
                'Choose whether this specification is a Yes/No option or is a number value.',
              position: 'right',
              allowBack: true,
            },
            {
              targetElementId: 'room-spec-input',
              description: 'Enter the value based on the type you selected.',
              position: 'right',
              allowBack: true,
            },
            {
              description: 'Upload room images here.',
              targetElementId: 'room-images-section',
              position: 'right',
              requiresInteraction: false,
              allowBack: true,
            },
            {
              description: 'Click Add Room to create the room.',
              targetElementId: 'add-room-submit',
              position: 'right',
              requiresInteraction: true,
              allowBack: true,
              whenClickedGoNextStep: true,
            },
            {
              description: 'This is the room you just added.',
              targetElementId: `'room-' + tutorialNewRoomId`,
              position: 'up',
              requiresInteraction: false,
              allowBack: false,
              isJsId: true,
            },
          ],
        },
        {
          mainTitle: 'Room Details',
          description: 'Learn how to view and manage room details',
          steps: [
            {
              description:
                'Here you will see the floor and room number and a edit button.',
              targetElementId: `'room-floorRoom-text-' + (RoomList.find(room => room.status === 'Empty')?.id)`,
              position: 'right',
              requiresInteraction: false,
              allowBack: true,
              dontInteract: true,
              isJsId: true,
            },
            {
              description: 'Here you will see the price and payment cycle.',
              targetElementId: `'room-price-payment-cycle' + (RoomList.find(room => room.status === 'Empty')?.id)`,
              position: 'down',
              requiresInteraction: false,
              allowBack: true,
              isJsId: true,
            },
            {
              description:
                'Here you will see the room specifications and a button to show room images.',
              targetElementId: `'room-typeOfRoomMainContainer' + (RoomList.find(room => room.status === 'Empty')?.id)`,
              position: 'left',
              requiresInteraction: false,
              allowBack: true,
              isJsId: true,
            },
            {
              description:
                'Here you will see the room status and a button to add a tenant to this room.',
              targetElementId: `'room-status-Main-container' + (RoomList.find(room => room.status === 'Empty')?.id)`,
              position: 'right',
              requiresInteraction: false,
              allowBack: true,
              dontInteract: true,
              isJsId: true,
            },
          ],
        },
        {
          mainTitle: 'Add a tenant',
          description: 'Learn how to add a tenant to a room',
          steps: [
            {
              description: 'Click the button to add a tenant.',
              targetElementId: `'room-status-add-tenant-button' + (RoomList.find(room => room.status === 'Empty')?.id)`,
              position: 'right',
              requiresInteraction: true,
              allowBack: true,

              isJsId: true,
            },
            {
              description:
                'A panel will show, enter all the details. Lets start with the tenant information. Enter the name, phone number, email, Description, TIN(if any), and rent reason.',
              targetElementId: `'room-add-tenant-container' + (RoomList.find(room => room.status === 'Empty')?.id)`,
              position: 'right',
              requiresInteraction: false,
              allowBack: true,
              isJsId: true,
            },
            {
              description:
                'Then now we will enter the tenant lease information. Enter the lease start date, lease end date, the date which it was signed,rent cycle, representative, currency, agreed price.',
              targetElementId: `'room-add-tenant-container' + (RoomList.find(room => room.status === 'Empty')?.id)`,
              position: 'right',
              requiresInteraction: false,
              allowBack: true,
              isJsId: true,
            },
            {
              description:
                "If this tenant was aquaierd by means of a broker, Click the track broker button, then select the broker if you haven't made one yet, just click add new broker then enter the info of the broker.",
              targetElementId: `'room-add-tenant-container' + (RoomList.find(room => room.status === 'Empty')?.id)`,
              position: 'right',
              requiresInteraction: false,
              allowBack: true,
              isJsId: true,
            },
            {
              description:
                'Then if you have any attachments or documents you can add it on the final area.',
              targetElementId: `'room-add-tenant-container' + (RoomList.find(room => room.status === 'Empty')?.id)`,
              position: 'right',
              requiresInteraction: false,
              allowBack: true,
              isJsId: true,
            },
            {
              description:
                'When complete just click the add button to add the tenant.',
              targetElementId: `'room-add-tenant-container' + (RoomList.find(room => room.status === 'Empty')?.id)`,
              position: 'right',
              requiresInteraction: false,
              allowBack: true,
              isJsId: true,
            },
          ],
        },
        {
          mainTitle: 'View Agreement',
          description: 'Learn how to view the agreement of a tenant',
          steps: [
            {
              description:
                'Click the view agreement button to view the agreement of the tenant.',
              targetElementId: `'room-view-agreement-button' + (RoomList.find(room => room.status === 'Taken')?.id)`,
              position: 'right',
              requiresInteraction: true,
              allowBack: true,
              isJsId: true,
            },
            {
              description:
                'In this panel you can view every detail of the tenant and the agreement.',
              targetElementId: `'room-view-agreement-container' + (RoomList.find(room => room.status === 'Taken')?.id)`,
              position: 'right',
              requiresInteraction: false,
              allowBack: true,
              isJsId: true,
            },
            //Start with the first one the tenant information section
            {
              description:
                'This is the tenant information section. Here you can see the tenant name, phone number, email, description, TIN(if any), and rent reason.',
              targetElementId: `'room-view-agreement-container' + (RoomList.find(room => room.status === 'Taken')?.id)`,
              position: 'right',
              requiresInteraction: false,
              allowBack: true,
              isJsId: true,
              blinkAsWellId: `'room-view-agreement-tenant-information' + (RoomList.find(room => room.status === 'Taken')?.id)`,
            },
            //Then agreement information section
            {
              description:
                'This is the agreement information section. Here you can see the lease start date, lease end date, the date which it was signed, rent cycle, representative, currency, agreed price. And you can also add a new agreement(lease).',
              targetElementId: `'room-view-agreement-container' + (RoomList.find(room => room.status === 'Taken')?.id)`,
              position: 'right',
              requiresInteraction: false,
              allowBack: true,
              isJsId: true,
              blinkAsWellId: `'room-view-agreement-information' + (RoomList.find(room => room.status === 'Taken')?.id)`,
            },
            // Then the tenant portal section
            {
              description:
                'This is the tenant portal section. The tenant portal makes it easier for you and the tenant by showing the tenant the rent payments. Here you can see the tenant portal link, and the tenant portal settings.',
              targetElementId: `'room-view-agreement-container' + (RoomList.find(room => room.status === 'Taken')?.id)`,
              position: 'right',
              requiresInteraction: false,
              allowBack: true,
              isJsId: true,
              blinkAsWellId: `'room-view-agreement-tenant-portal' + (RoomList.find(room => room.status === 'Taken')?.id)`,
            },
            //THen the utility Section
            {
              description:
                'This is the utility section. Here you can pick what utilities to bill the tenant for, set custom prices, choose payment cycles (monthly or custom days), and mark utilities as "Always Ask" to customize the price each time. You can also select different currencies for each utility payment. You can select what kind of reminders to send.',
              targetElementId: `'room-view-agreement-container' + (RoomList.find(room => room.status === 'Taken')?.id)`,
              position: 'right',
              requiresInteraction: false,
              allowBack: true,
              isJsId: true,
              blinkAsWellId: `'room-view-agreement-utility-settings' + (RoomList.find(room => room.status === 'Taken')?.id)`,
            },
            //tHEN THE fiLE ATTACHMENTS SECTION
            {
              description:
                'This is the file attachments section. Here you can see the file attachments of the tenant. You can download, add, delete, and view the file attachments.',
              targetElementId: `'room-view-agreement-container' + (RoomList.find(room => room.status === 'Taken')?.id)`,
              position: 'right',
              requiresInteraction: false,
              allowBack: true,
              isJsId: true,
              blinkAsWellId: `'room-view-agreement-file-attachments' + (RoomList.find(room => room.status === 'Taken')?.id)`,
            },
            //Then the reminders and notification sectoin
            {
              description:
                'This is the reminders and notification section. Here you can set up automated notifications for rent payments. You can enable email and SMS notifications to be sent to both tenants and representatives at different times - 5 days before due, 3 days before, 1 day before, on the due date, and several days after. For tenant notifications, you can select specific email and SMS templates to be used for each timing.',
              targetElementId: `'room-view-agreement-container' + (RoomList.find(room => room.status === 'Taken')?.id)`,
              position: 'right',
              requiresInteraction: false,
              allowBack: true,
              isJsId: true,
              blinkAsWellId: `'room-view-agreement-reminders-and-notifications' + (RoomList.find(room => room.status === 'Taken')?.id)`,
            },
          ],
        },
        {
          mainTitle: 'Payment Timeline',
          description:
            'Learn how to manage rent payments using the payment timeline',
          steps: [
            {
              description: 'Click here to view the payment timeline.',
              targetElementId: `'room-payment-timeline-button' + (RoomList.find(room => room.status === 'Taken')?.id)`,
              position: 'right',
              requiresInteraction: true,
              allowBack: true,
              isJsId: true,
            },
            {
              description:
                'This is the payment timeline. Each line represents a payment period.',
              targetElementId: `'payment-timeline-container' + (RoomList.find(room => room.status === 'Taken')?.id)`,
              position: 'down',
              requiresInteraction: false,
              allowBack: true,
              isJsId: true,
            },
            {
              description:
                'The colors indicate payment status: Red for overdue, Gold for paid, Blue for upcoming, and Cyan for payments due soon (within 10 days).',
              targetElementId: `'payment-timeline-container' + (RoomList.find(room => room.status === 'Taken')?.id)`,
              position: 'left',
              requiresInteraction: false,
              allowBack: true,
              isJsId: true,
              marginInDirection: 20,
            },
            {
              description:
                'Click "Pay" under any payment to mark it as paid. And click again to mark it as unpaid.',
              targetElementId: `'payment-timeline-container' + (RoomList.find(room => room.status === 'Taken')?.id)`,
              position: 'left',
              requiresInteraction: false,
              allowBack: true,
              isJsId: true,
              marginInDirection: 20,
            },
            {
              description:
                'Click RCT to toggle receipt view. When enabled, you can upload and manage payment receipts.',
              targetElementId: `'payment-timeline-rct-button' + (RoomList.find(room => room.status === 'Taken')?.id)`,
              position: 'down',
              requiresInteraction: true,
              allowBack: true,
              isJsId: true,
            },
            {
              description:
                'Click "Current Date" to scroll the timeline to today\'s date.',
              targetElementId: `'payment-timeline-current-date' + (RoomList.find(room => room.status === 'Taken')?.id)`,
              position: 'down',
              requiresInteraction: true,
              allowBack: true,
              isJsId: true,
            },
           {
              description:
                'For open-ended agreements, you can extend the payment schedule by clicking this button.',
              targetElementId: `'payment-timeline-extend' + (RoomList.find(room => room.status === 'Taken')?.id)`,
              position: 'right',
              requiresInteraction: false,
              allowBack: true,
              isJsId: true,
            },
          ],
        },
        {
          mainTitle: 'Calendar View',
          description: 'Learn how to use the calendar view to manage rooms',
          steps: [
            {
              description: 'Click here to switch to calendar view.',
              targetElementId: 'room-calendar-toggle',
              position: 'down',
              requiresInteraction: true,
              allowBack: true,
            },
            {
              description: 'The calendar shows the rent payments by date.',
              targetElementId: 'calendar-main-container',
              position: 'left',
              requiresInteraction: false,
              allowBack: true,
            },
            {
              description:
                'You can search for tenants and if you want to see further into the future or past, enter the amount of months in the inputs.',
              targetElementId: 'calendar-navigation',
              position: 'down',
              requiresInteraction: false,
              allowBack: true,
            },
            {
              description:
                'Hover over the rectangles to see the rent payments.',
              targetElementId: 'calendar-main-container',
              position: 'left',
              requiresInteraction: false,
              allowBack: true,
            },
          ],
        },
      ],
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
      hasToBeIn: 'Tools',
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
              targetElementId: 'tax-percentage',
              description:
                'Enter your tax percentage, which will be used for reports and statistics.',
              position: 'down',
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
              targetElementId: 'formating-numbers',
              description:
                'Enable this to display large numbers in shortened format (e.g., 1M instead of 1,000,000) for better readability.',
              position: 'down',
              allowBack: true,
            },
        
            {
              targetElementId: 'representativeEmails',
              description:
                'Here you edit the representative emails for your property so they can receive rent reminders and utility reminders through email and sms, and under it you can see the landloard email and phone number which will show in the emails and sms sent to tenants.',
              position: 'right',
              allowBack: true,
            },
            
          ],
        },
      ],
    },
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
            targetElementId: 'dashboard-title',
            position: 'down',
            allowBack: true,
          },  {
            description:
              'Click here to view the overview section.',
            targetElementId: 'dashboard-overview-tab',
            position: 'right',requiresInteraction: true,
            allowBack: true,
          },
          {
            description:
              'Here you can see a pie chart of Taken and empty rooms.',
            targetElementId: 'DashbRoomSummary',
            position: 'down',
            allowBack: true,
          },
          {
            description:
              'Here you can see the total collected rent income and the expected income(uncollected rent), of every month in a bar graph.',
            targetElementId: 'DashbTotalCollected',
            position: 'down',
            allowBack: true,
          },
          {
            description:
              'Here you can see the unpaid payments that are past due and the upcoming payments.',
            targetElementId: 'DashbPastPayments',
            position: 'left',
            allowBack: true,
          },
          {
            description:
              "Here you can see the revenue generated per square meter.",
            targetElementId: 'DashbRevenuePerSquareFoot',
            position: 'left',
            allowBack: true,
          },
          {
            description:
              'Here you can see the top performing units, brokers, and most loyal tenants.',
            targetElementId: 'TopPerformingUnits',
            position: 'left',
            allowBack: true,
          },
          {
            description:
              'Here you can see the tenant acquisition trends over time.',
            targetElementId: 'TenantGrowthWidget',
            position: 'left',
            allowBack: true,
          },
          {
            description:
              'Here you can see the tax obligations in a bar graph.',
            targetElementId: 'DashbOverAllTax',
            position: 'left',
            allowBack: true,
          },
          {
            description:
              'Stay informed about lease agreements that are approaching renewal or expiration.',
            targetElementId: 'UpcomingAgreements',
            position: 'left',
            allowBack: true,
          },
        ],
      },
      sections: [
      {
     
        description: 'See the expenses statistics of your property',
        mainTitle: 'Expense Section',
        steps: [
          {
            description: 'Click here to access the Expenses section of your dashboard.',
            targetElementId: 'dashboard-expenses-tab',
            position: 'right',
            requiresInteraction: true,
            allowBack: true,
          },
          {
            description: 
              'Here you can see the net profit of your property, total collected rent - total expenses. And the second bar shows the Expected income(uncollected rent+collected rent) - expenses.',
            targetElementId: 'DashbNetProfitTotalCollected',
            position: 'down',
            allowBack: true,
          },
          {
            description:
              'Here you can see the expenses of your property month by month.',
            targetElementId: 'DashbMonthlyExpenseTrendWidget', 
            position: 'down',
            allowBack: true,
          },
          {
            description:
              'Here you can see the history of your expenses.',
            targetElementId: 'DashbExpenseHistory',
            position: 'up',
            allowBack: true,
          },
          {
            description: 
              'Here you can see the upcoming expenses of your property.',
            targetElementId: 'DashbUpcomingExpensesWidget',
            position: 'up',
            allowBack: true,
          }
        ]
      },
   {   description: 'See the lists of people',
      mainTitle: 'People List Section',
      steps: [
        {
          description: 'Click here to see the list of all your tenants.',
          targetElementId: 'dashboard-tenants-list-tab',
          position: 'right',
          requiresInteraction: true,
          allowBack: true,
        },
        {
          description: 'Click here to see the list of all your brokers.',
          targetElementId: 'dashboard-broker-list-tab',
          position: 'right',
          requiresInteraction: true,
          allowBack: true,
        },
        {
          description: 'Click here to see the list of tenant reviews.',
          targetElementId: 'dashboard-tenant-reviews-tab',
          position: 'right',
          requiresInteraction: true,
          allowBack: true,
        },
       
      ]},
   {   description: 'See the email and sms history',
      mainTitle: 'Email and SMS History Section',
      steps: [
        {
          description: 'Click here to see your email history. You can view all emails sent to tenants, including payment reminders and other notifications.',
          targetElementId: 'dashboard-email-history-tab',
          position: 'right',
          requiresInteraction: true,
          allowBack: true,
        },
        {
          description: 'Click here to see your SMS history. You can track all text messages sent to tenants for important updates and reminders.',
          targetElementId: 'dashboard-sms-history-tab',
          position: 'right',
          requiresInteraction: true,
          allowBack: true,
        },
      
      ]},
   {   description: 'Track and monitor all actions performed in your property management system by different users, including changes to rooms, tenants, payments and more',
      mainTitle: 'Action History Section', 
      steps: [
        {
          description: 'Click here to access the Action History dashboard where you can view a detailed log of all actions of every user in your property management system. You can filter by action type, date ranges, and users who performed the actions. The history shows important details like what changed, who made the change, and when it occurred.',
          targetElementId: 'dashboard-action-history-tab',
          position: 'right',
          requiresInteraction: true,
          allowBack: true,
        },
       
      ]}
      
      ,
      {   description: 'See the report of your property',
         mainTitle: 'Report Section', 
         steps: [
           {
             description: 'Here you can see the basic rental income report of your property. Input a date range then click generate to see the report.',
             targetElementId: 'dashboard-basic-rental-income-report-tab',
             position: 'right',
             requiresInteraction: true,
             allowBack: true,
           },
          
         ]}
     
      
      ],
    },
  ],
};
