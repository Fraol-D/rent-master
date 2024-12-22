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
  whenClickedGoNextStep?: boolean;
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
        //Fisrt step on the main propertymanagmenttyitle
        //Second step on the refresh add new proeprty and back no click
        //Third step on the the current user and switch user no click
        //Forth on the property list no click
        //THEN NEXT SECTION
        //fisrt step on add a property button yes touch
        //second step on the peroperty name input yes touch
        //Third step on the peroperty location input yes touch
        //Fourth step on the peroperty location input yes touch
        //Fifth step on the peroperty Discription input yes touch
        //Sixth step on the peroperty add button yes touch
        //SEVENTH STEP ON THE PROPERTY LIST NO CLICK
        //Eigth step on the property they just added
        //NIneth step on the property edit button no click
        //tenth stpe on the select property button no click

        // ALL done with property management
        steps: [
          // Step 1: Welcome message on property management title
          {
            description:
              'Welcome to the Property Manager! This is where you will be managing your properties.',
            targetElementId: 'Property-Management-Title',
            position: 'down',
            requiresInteraction: false,
            allowBack: true,
          },
          // Step 2: Show refresh, add new property and back buttons
          {
            description:
              'Here you will see buttons which will allow you to refresh and add a new property',
            targetElementId: 'Property-Management-Buttons',
            position: 'down',
            requiresInteraction: false,
            allowBack: true,
            dontInteract: true,
          },
          // Step 3: Show current user and switch user options
          {
            description:
              'Here you can see the current user and switch between other users.',
            targetElementId: 'Property-Management-switchUser',
            position: 'down',
            requiresInteraction: false,
            allowBack: true,
            dontInteract: true,
          },
          // Step 4: Show property list
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
      sections: [
        // {
        //   mainTitle: 'Adding a Property',
        //   description: 'Learn how to add and manage a new property',
        //   steps: [
        //     // Step 1: Click add property button
        //     {
        //       description: 'Click here to add a new property',
        //       targetElementId: 'property-add-btn',
        //       position: 'down',
        //       requiresInteraction: true,
        //       allowBack: true,
        //     },
        //     // Step 2: Property name input
        //     {
        //       description: 'Enter the name of your property',
        //       targetElementId: 'add-property-name',
        //       position: 'right',
        //       requiresInteractionInput: true,
        //       allowBack: true,
        //       additionalZIndexElements: ['add-new-property-panel'],
        //     },
        //     // Step 3: Property location input
        //     {
        //       description: 'Enter the location of your property',
        //       targetElementId: 'add-property-location',
        //       position: 'right',
        //       requiresInteractionInput: true,
        //       allowBack: true,
        //       additionalZIndexElements: ['add-new-property-panel'],
        //     },
        //     // Step 4: Property map location
        //     {
        //       description: 'Add a description for your property',
        //       targetElementId: 'add-property-description',
        //       position: 'right',
        //       requiresInteractionInput: true,
        //       allowBack: true,
        //       additionalZIndexElements: ['add-new-property-panel'],
        //     },
        //     // Step 6: Add property button
        //     {
        //       description: 'Click to add your new property',
        //       targetElementId: 'add-property-final-btn',
        //       position: 'right',
        //       requiresInteraction: true,
        //       allowBack: true,
        //       additionalZIndexElements: ['add-new-property-panel'],
        //     },
        //     // Step 7: View updated property list
        //     {
        //       description: 'You will find your new property in the list',
        //       targetElementId: 'Property-Management-List',
        //       position: 'down',
        //       requiresInteraction: false,
        //       allowBack: false,
        //     },
        //   ],
        // },
        // {
        //   mainTitle: 'Managing Properties',
        //   description: 'Learn how to manage your existing properties',
        //   steps: [
        //     // Step 1: Show newly added property
        //     {
        //       description: 'Here is your newly added property',
        //       targetElementId: '',
        //       position: 'down',
        //       requiresInteraction: false,
        //       allowBack: true,
        //     },
        //     // Step 2: Show edit property button
        //     {
        //       description:
        //         'You can edit your property details using this button',
        //       targetElementId: '',
        //       position: 'down',
        //       requiresInteraction: false,
        //       allowBack: true,
        //     },
        //     // Step 3: Show select property button
        //     {
        //       description: 'Click here to select and manage this property',
        //       targetElementId: '',
        //       position: 'down',
        //       requiresInteraction: false,
        //       allowBack: true,
        //     },
        //   ],
        // },
      ],
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

          //Step 3 Show them how to add new user yes click
          {
            description:
              'Click this button to add a new user. You can then assign specific properties and privileges to them.',
            targetElementId: 'app-user-buttons',
            position: 'down',
            requiresInteraction: true,
            allowBack: true,
            dontInteract: false,
          },
          //step 4 Show them how to select or edit app user no click
          {
            description: 'This is the new app user you just added.',
            targetElementId: 'tutorialNewAppUserId',
            position: 'left',
            requiresInteraction: false,
            allowBack: false,
            isJsId: true,       dontInteract: true,
          },
          {
            description: 'Enter the name or role of the app user.',
            targetElementId: 'tutorialNewAppUserId + " app-user-edit-name-input"',
            position: 'left',
            requiresInteraction: true,
            allowBack: false,
            isJsId: true,       dontInteract: false,
          },
          {
            description: 'When done click save',
            targetElementId: 'tutorialNewAppUserId + " app-user-edit-name-save"',
            position: 'left',
            requiresInteraction: true,
            allowBack: true,
            whenClickedGoNextStep: true,
            isJsId: true,       dontInteract: false,
          },
          {
            description: 'This is edit and select buttons which allow you to edit or select the app user.',
            targetElementId: 'tutorialNewAppUserId + " app-user-edit-select"',
            position: 'left',
            requiresInteraction: false,
            allowBack: true,
            isJsId: true,       dontInteract: true,
          },
          {
            description: 'These are the privileges you can allow or disallow for this user.',
            targetElementId: 'tutorialNewAppUserId + " privileges-list"',
            position: 'left',
            requiresInteraction: false,
            allowBack: true,
            isJsId: true,       dontInteract: true,
          },
          {
            description: 'This section is for what properties this user is able to access and manage.',
            targetElementId: 'tutorialNewAppUserId + " appuser-properties-list"',
            position: 'left',
            requiresInteraction: false,
            allowBack: true,
            isJsId: true,       dontInteract: true,
          },
          {
            description: 'This section allows you to enable password and username login for this user account. Anyone with the correct username and password will be able to log in.',
            targetElementId: 'tutorialNewAppUserId + " appuser-account-password"',
            position: 'left',
            requiresInteraction: false,
            allowBack: true,
            isJsId: true,       dontInteract: true,
          },
          //step 5 show them how to allow and dis allow privilages no click
          //step 6 show them the allowed propertyiesand how to add proerpeties
          //step 7 show them the sign in with password

        
        ],
      },
      sections: [],
    },
  ],
};
