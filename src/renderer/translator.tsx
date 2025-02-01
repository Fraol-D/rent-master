const tl = (LangCode: number) => {
  return {
    gen: {
      changeLanguage: ['Change Language', 'ቋንቋ ይቀየር'],
    },
    app: {
      login: ['Log in', 'ግባ'],
      signup: ['Sign up', 'ተፈረም'],
      submit: ['Submit', 'አስገባ'],
      email: ['Email', 'ኢመይል'],
      username: ['Username', 'መጠቀሚያ ስም'],
      password: ['Password', 'ማለፍያ ቃል'],
      fullname: ['Full Name', 'ሙሉ ስም'],
      companyname: ['Company Name', 'ኩምፓኒያ ስም'],
      phonenumber: ['Phone Number', 'ስልክ ቁጥር'],
      back: ['Back', 'ተመለስ'],
      verify: ['Verify', 'እርግጠኛ ሁን'],
      yes: ['Yes', 'አው'],
      no: ['No', 'አይ'],
      signOutConfirmation: [
        'Are you sure you want to sign out?',
        '@Are you sure you want to sign out?',
      ],
      signOut: ['Sign Out', '@Sign Out'],
      cancel: ['Cancel', '@Cancel'],
      paymentCycles: {
        monthly: ['Monthly', '@Monthly'],
        weekly: ['Weekly', '@Weekly'],
        fifteenDays: ['15 days', '@15 days'],
        thirtyDays: ['30 days', '@30 days'],
        sevenDays: ['7 days', '@7 days'],

        daily: ['Daily', '@Daily'],
        annually: ['Annually', '@Annually'],
        customDays: ['Custom', '@Custom'],
        customDaysPlaceholder: ['10', '@10'],
      },
      loginPage: {
        orSignUp: ["Don't have an account? Sign up", 'አካውንት የለህም? ወይ ተፈረም'],
        toAdmin: ['Log in to ADMIN', '@Log in to ADMIN'],
        toAdminDescription: [
          'Log in to ADMIN with account Email and Password',
          '@Log in to ADMIN with account Email and Password',
        ],
        toAppUser: ['Log in to App User', '@Log in to App User'],
        toAppUserDescription: [
          'Log in to App User with Username and Password',
          '@Log in to App User with Username and Password',
        ],
        forgotPassword: ['Forgot password?', '@Forgot password?'],
        rememberMe: ['Remember me', '@Remember me'],
        err: {
          unknownEmail: [
            'Email could not be found. Please try again.',
            '@Email could not be found. Please try again.',
          ],
          invalidEmail: [
            'Invalid email or password',
            '@Invalid email or password',
          ],
          emailNotFound: [
            'Email could not be found. Please try again.',
            '@Email could not be found. Please try again.',
          ],
          appUserUnauthorizedPassword: [
            'This AppUser is not allowed to enter with password. Please contact Administrator.',
            '@This AppUser is not allowed to enter with password. Please contact Administrator.',
          ],
          invalidUsername: [
            'Invalid Username or password',
            '@Invalid Username or password',
          ],
          general1: ['Error during login:', '@Error during login:'],
          general2: [
            'An error occurred during login. Please try again.',
            '@An error occurred during login. Please try again.',
          ],
          success: ['Login successful', '@Login successful'],
        },
      },
      signupPage: {
        orLogIn: ['Or Log In', 'ወይንም ግባ'],
        passwordOnceMore: ['Repeat password', 'ማለፍያ ቃል ይድገሙ'],
        signUpDescription: [
          'Sign up with your Email and Password',
          '@Sign up with your Email and Password',
        ],
        verifCodeSent: [
          'Verification code sent to your email',
          '@Verification code sent to your email',
        ],
        enterCode: ['Enter Code', '@Enter Code'],
        resendCode: ['Resend code', '@Resend code'],
        verifSuccess: [
          'Verification successful! <br /> Now enter your info',
          '@Verification successful! <br /> Now enter your info',
        ],
      },
      navbar: {
        tabs: {
          dashboard: ['Dashboard', '@Dashboard'],
          rooms: ['Rooms', '@Rooms'],
          expenses: ['Expenses', '@Expenses'],
          tools: ['Tools', '@Tools'],
        },
        upload: {
          uploadButton(
            ChangeMade: number,
            uploadProgress: number,
            LangCode: number
          ) {
            if (ChangeMade > 0) {
              if (uploadProgress === 100 || uploadProgress === 0) {
                if (LangCode == 0) {
                  return (
                    "Upload <br /> \
                                <span style={{ fontSize: 'var(--10px-V)' }}> \
                                  " +
                    ChangeMade +
                    ' change</span>'
                  );
                } else if (LangCode == 1) {
                  return (
                    "@Upload <br /> \
                                <span style={{ fontSize: 'var(--10px-V)' }}> \
                                  " +
                    ChangeMade +
                    ' change</span>'
                  );
                }
              } else if (uploadProgress >= 50) {
                if (LangCode == 0) {
                  return 'Syncing';
                } else if (LangCode == 1) {
                  return '@Syncing';
                }
              } else {
                if (LangCode == 0) {
                  return 'Uploading';
                } else if (LangCode == 1) {
                  return '@Uploading';
                }
              }
            } else {
              if (LangCode == 0) {
                return 'No Change';
              } else if (LangCode == 1) {
                return '@No Change';
              }
            }
          },
          upload: ['Upload', '@Upload'],
          resetOfflineChanges(ChangeMade: number, LangCode: number) {
            if (LangCode == 0) {
              return 'Reset ' + ChangeMade + ' Offline Changes';
            } else if (LangCode == 1) {
              return '@Reset ' + ChangeMade + ' Offline Changes';
            }
          },
          completeSync: ['Complete Sync', '@Complete Sync'],
          sync: ['Sync', '@Sync'],
          alerts: {
            offline: [
              'You are currently offline',
              '@You are currently offline',
            ],
          },
          syncIncomingChanges(
            OnlineChanges: number,
            ChangeMade: number,
            LangCode: number
          ) {
            if (
              OnlineChanges === 0 ||
              ChangeMade == null ||
              ChangeMade == undefined ||
              Number.isNaN(ChangeMade)
            ) {
              return '<><>';
            } else if (LangCode == 0) {
              return '<>Sync {OnlineChanges} incoming changes</>';
            } else if (LangCode == 1) {
              return '<>@Sync {OnlineChanges} incoming changes</>';
            }
          },
          setAsMain: ['Set as main', '@Set as main'],
          setAsMainTitle: [
            'Synchronizes the local database with the online server, overwriting the server data with the current local data, including any offline changes.',
            '@Synchronizes the local database with the online server, overwriting the server data with the current local data, including any offline changes.',
          ],
          assets: ['Assets', '@Assets'],
          roomAssets: [
            '(Room Pictures,Documents)',
            '(@Room Pictures,@Documents)',
          ],
          uploadRoomAssets: ['Upload Room Assets', '@Upload Room Assets'],
          uploadRoomAssetsTitle: [
            'Synchronize Local Room Assets to Server',
            '@Synchronize Local Room Assets to Server',
          ],
          downloadRoomAssets: ['Download Room Assets', '@Download Room Assets'],
          downloadRoomAssetsTitle: [
            'Retrieve Room Assets from Server',
            '@Retrieve Room Assets from Server',
          ],
          backup: ['Backup', '@Backup'],
          createBackup: ['Create Backup', '@Create Backup'],
          createBackupTitle: [
            'Create Local Data Backup',
            '@Create Local Data Backup',
          ],
          loadBackup: ['Load Backup', '@Load Backup'],
          loadBackupTitle: [
            'Restore from Data Backup',
            '@Restore from Data Backup',
          ],
          revertData: ['Revert to old', '@Revert to old'],
          revertDataTitle: [
            'Return to Current Main Data',
            '@Return to Current Main Data',
          ],
          setMainBackup: ['Set as main', '@Set as main'],
          setMainBackupTitle: [
            'Make This Backup the Main Data',
            '@Make This Backup the Main Data',
          ],
          refreshData: ['Refresh Data', '@Refresh Data'],
        },
      },
        roomPage: {
        sidebar: {
          pageTitle: ['Room Manager', '@Room Manager'],
          closeSidebar: ['Close Sidebar', '@Close Sidebar'],
          addRoom: ['Add Room', '@Add Room'],
          showRoomCalendar: ['Show Calendar', '@Show Calendar'],
          hideRoomCalendar: ['Hide Calendar', '@Hide Calendar'],
          showRoomCalendarTitle: [
            'Show Tenant Payment Calendar',
            '@Show Tenant Payment Calendar',
          ],
          hideRoomCalendarTitle: [
            'Hide Tenant Payment Calendar',
            '@Hide Tenant Payment Calendar',
          ],
          clearAllFilters: ['Clear All Filters', '@Clear All Filters'],
          searchRooms: ['Search rooms', '@Search rooms'],
          tenant: ['Tenant', '@Tenant'],
          tenantSearchBar: ['Enter tenant name', '@Enter tenant name'],
          floor: ['Floor', '@Floor'],
          room: ['Room', '@Room'],
          filterRooms: ['Filter rooms', '@Filter rooms'],
          roomStatus: ['Room status', '@Room status'],
          roomStatusSelect: ['Select room status', '@Select room status'],
          all: ['All', '@All'],
          taken: ['Taken', '@Taken'],
          empty: ['Empty', '@Empty'],
          price: ['Price', '@Price'],
          dueDate: ['Due Date', '@Due Date'],
          dueDatePlaceholder: [`5 days`, `@5 days`],
          squareMeters: ['SMeters', '@SMeters'],
          squareMetersPlaceholder: ['35m²', '@35m²'],
          filterCurrency: ['Currency', '@Currency'],
          allCurrencies: ['All Currencies', '@All Currencies'],
          addARoom: ['Add a room', '@Add a room'],
          floorNumber: ['Floor number', '@Floor number'],
          roomNumber: ['Room number', '@Room number'],
          alreadyExist: ['Already exist', '@Already exist'],
          priceIncVAT: ['Price (inc. VAT)', '@Price (inc. VAT)'],
          paymentCycle: ['Payment cycle', '@Payment cycle'],
          currency: ['Currency', '@Currency'],
          customDays: ['Custom Days', '@Custom Days'],
          customDaysPlaceholder: ['10', '10'],
          squareMetersFull: ['Square Meters', '@Square Meters'],
          squareMetersFullPlaceholder: ['35m²', '@35m²'],
          roomSpecifications: ['Room Specifications', '@Room Specifications'],
          addRoomSpecification: ['Add', '@Add'],
          roomIndex: ['Room Index', '@Room Index'],
          clickAddAboveToAddSpecifications: [
            'Click "Add" above to add specifications',
            '@Click "Add" above to add specifications',
          ],
          exampleSpecifications: [
            'Example specifications',
            '@Example specifications',
          ],
          bedrooms: ['• Bedrooms: 3', '@• Bedrooms: 3'],
          balcony: ['• Balcony: Yes', '@• Balcony: Yes'],
          Specfication: {
            name: ['Name', '@Name'],
            enterName: ['Enter name', '@Enter name'],
            yes: ['Yes', '@Yes'],
            no: ['No', '@No'],
            type: ['Type', '@Type'],
            number: ['Number', '@Number'],
            value: ['Value', '@Value'],
          },
          ImageInteractor: {
            noImagesAvailable: ['No images available', '@No images available'],
            addImage: ['Add Image', '@Add Image'],
            Del: ['Del', '@Del'],
            Files: ['Files', '@Files'],
            Download: ['Download', '@Download'],
            UploadingImages: ['Uploading Images', '@Uploading Images'],
            UploadedFiles: (uploadedFiles: number, totalFiles: number) => {
              if (LangCode == 0) {
                return uploadedFiles + ' of ' + totalFiles + ' files uploaded';
              } else if (LangCode == 1) {
                return (
                  '@' + uploadedFiles + ' of ' + totalFiles + ' files uploaded'
                );
              }
            },
            alert: {
              AllFilesAreAboveThe5MBLimit: [
                'All files are above the 5MB limit',
                '@All files are above the 5MB limit',
              ],
              SomeFilesExceededThe5MBLimitAndWereNotUploaded: [
                'Some files exceeded the 5MB limit and were not uploaded',
                '@Some files exceeded the 5MB limit and were not uploaded',
              ],
              AnErrorOccurredWhileUploadingFilesPleaseTryAgain: [
                'An error occurred while uploading files. Please try again',
                '@An error occurred while uploading files. Please try again',
              ],
              ImagesUploadedSuccessfully: [
                'Images uploaded successfully',
                '@Images uploaded successfully',
              ],
              AreYouSureYouWantToDeleteThisImage: [
                'Are you sure you want to delete this image?',
                '@Are you sure you want to delete this image?',
              ],
              ImageDeletedSuccessfully: [
                'Image deleted successfully',
                '@Image deleted successfully',
              ],
            },
          },
          afterThisRoomIsAdded: [
            'After this room is add the below options will be applied to the next room',
            '@After this room is add the below options will be applied to the next room',
          ],
          continueAddingSettings: {
            incrementRoomNumber: [
              'Increment Room Number',
              '@Increment Room Number',
            ],
            resetRoomNumber: ['Reset Room Number', '@Reset Room Number'],
            incrementFloor: [
              'Increment Floor Number',
              '@Increment Floor Number',
            ],
            keepFloorSame: [
              'Keep Floor Number same',
              '@Keep Floor Number same',
            ],
            resetCurrency: ['Reset Currency', '@Reset Currency'],
            resetPrice: ['Reset Price', '@Reset Price'],
            resetPaymentCycle: ['Reset Payment Cycle', '@Reset Payment Cycle'],
            resetSquareMeters: ['Reset Square Meters', '@Reset Square Meters'],
            resetRoomSpecifications: [
              'Reset Room Specifications',
              '@Reset Room Specifications',
            ],
            resetRoomImages: ['Reset Room Images', '@Reset Room Images'],
          },
        addAnotherRoom: ['Add Another Room', '@Add Another Room'],
        adding: ['Adding...', '@Adding...'],

        },
        roomAbbreviation: ['Rm.', '@Rm.'],
        floorAbbreviation: ['Flr.', '@Flr.'],
        floor: ['Floor', '@Floor'],
        room: ['Room', '@Room'],
        floorAndRoom: ['Floor and Room', '@Floor and Room'],
        noRoomsFound: ['There are no rooms. Add a room by clicking the "Add room" button on the left.', '@There are no rooms. Add a room by clicking the "Add room" button on the left.'],
        incVAT: ['Inc VAT', '@Inc VAT'],
        exampleSpecifications: ['Example specifications', '@Example specifications'],
        bedrooms: ['• Bedrooms: 3', '@• Bedrooms: 3'],
        balcony: ['• Balcony: Yes', '@• Balcony: Yes'],
    },
    dashboardPage: {
        occupancy: ['Occupancy', '@Occupancy'],
        agreedPrice: ['Agreed Price', '@Agreed Price'],
        addedTime: ['Added Time', '@Added Time'],
        noAgreementsFound: ['No agreements found', '@No agreements found'],
        noRecommendations: ['No recommendations', '@No recommendations'],
        commission: ['Commission', '@Commission'],
        noReviewsFound: ['No reviews found', '@No reviews found'],
        },
        databasePage: {
            selectTable: ['Select a table', '@Select a table'],
            searchAllFields: ['Search all fields', '@Search all fields'],
            mainSearch: ['Main search', '@Main search'],
            loading: ['Loading...', '@Loading...'],
            noDataAvailable: ['No data available', '@No data available'],
            actions: ['Actions', '@Actions'],
            goTo: ['Go to', '@Go to'],
        },
        peopleComponentPage: {
            noTenantsFound: ['No tenants found', '@No tenants found'],
            noBrokersFound: ['No brokers found', '@No brokers found'],
            open: ['Open', '@Open'],
            in: ['In', '@In'],
            out: ['Out', '@Out'],
            tenantName: ['Tenant Name', '@Tenant Name'],
            startTime: ['Start Time', '@Start Time'],
            endTime: ['End Time', '@End Time'],
            signTime: ['Sign Time', '@Sign Time'],
            agreedPrice: ['Agreed Price', '@Agreed Price'],
            paymentCycle: ['Payment Cycle', '@Payment Cycle'],
            memo: ['Memo', '@Memo'],
            rentReserved: ['Rent Reserved', '@Rent Reserved'],
            representative: ['Representative', '@Representative'],
            status: ['Status', '@Status'],
            occupancy: ['Occupancy', '@Occupancy'],
            floor: ['Floor', '@Floor'],
            room: ['Room', '@Room'],
            broker: ['Broker', '@Broker'],
            commission: ['Commission', '@Commission'],
            tenant: ['Tenant', '@Tenant'],
            payment: ['Payment', '@Payment'],
            totalEarnings: ['Total Earnings', '@Total Earnings'],
            stars: ['Stars', '@Stars'],
            tenantDescription: ['Tenant Description', '@Tenant Description'],
            endReason: ['End Reason', '@End Reason'],
            dates: ['Dates', '@Dates'],
            phoneNumber: ['Phone Number', '@Phone Number'],
            description: ['Description', '@Description'],
            tin: ['TIN', '@TIN'],
            rentReason: ['Rent Reason', '@Rent Reason'],
            agreement: ['Agreement', '@Agreement'],
            times: ['Times', '@Times'],
            addedTime: ['Added Time', '@Added Time'],
        },
        toolsPage: {
            emptyDaysBeforeForEmailNotification: ['Please enter days before for email notification', '@Please enter days before for email notification'],
            invalidPhoneNumber: ['Please enter a valid 10-digit phone number', '@Please enter a valid 10-digit phone number'],
            defaultNotificationsSettingsSuccess: ['Default notifications applied to all expenses successfully!', '@Default notifications applied to all expenses successfully!'],
            defaultNotificationsSettingsFailed: ['Failed to apply default notifications. Please try again.', '@Failed to apply default notifications. Please try again.'],
            invalidEmailAddress: ['Invalid email address', '@Invalid email address'],
            invalidPhoneNumberFormat: ['Invalid phone number format. Please enter a 10-digit number starting with 0', '@Invalid phone number format. Please enter a 10-digit number starting with 0'],
            failedToSendSMS: ['Failed to send SMS', '@Failed to send SMS'],
            emailSentSuccessfully: ['Email sent successfully', '@Email sent successfully'],
            sent: ['Sent', '@Sent'],
            failed: ['Failed', '@Failed'],
            defaultEmailTemplatesConfirmation: ['Are you sure you want to delete all existing email templates and replace with defaults? This action cannot be undone.', '@Are you sure you want to delete all existing email templates and replace with defaults? This action cannot be undone.'],
            replaceEmailTemplates: ['Replace Email Templates', '@Replace Email Templates'],
            keep: ['Keep', '@Keep'],
            replace: ['Replace', '@Replace'],
            delete: ['Delete', '@Delete'],
            defaultSMSConfirmation: ['Are you sure you want to delete all existing sms templates and replace with defaults? This action cannot be undone.', '@Are you sure you want to delete all existing sms templates and replace with defaults? This action cannot be undone.'],
            replaceSMSTemplates: ['Replace SMS Templates', '@Replace SMS Templates'],
            newTemplate: ['New Template', '@New Template'],
            emailTemplatesNotAvailable: ['Email templates are not available in tryout mode', '@Email templates are not available in tryout mode'],
            smsTemplatesNotAvailable: ['SMS templates are not available in tryout mode', '@SMS templates are not available in tryout mode'],
            applyingNotifications: ['Applying notification settings to all expenses...', '@Applying notification settings to all expenses...'],
            resetingTemplates: ['Reseting Templates...', '@Reseting Templates...'],
            settings: ['Settings', '@Settings'],
            taxPercentages: ['Tax percentages', '@Tax percentages'],
            taxPercentage: ['Tax percentage', '@Tax percentage'],
            save: ['Save', '@Save'],
            offlineTaxPercentageChangeError: ['Please connect to the internet to change tax percentage', '@Please connect to the internet to change tax percentage'],
            defaultRoomSpecifications: ['Default Room Specifications', '@Default Room Specifications'],
            add: ['Add', '@Add'],
            defaultRoomSpecificationsDescription: ['These specifications will be shown when adding a new room, so you don\'t have to enter them repeatedly.', '@These specifications will be shown when adding a new room, so you don\'t have to enter them repeatedly.'],
            clickAddAboveToAddSpecifications: ['Click "Add" above to add specifications</div>Example specifications:<div>• Bedrooms: 3</div><div>• Balcony: Yes', '@Click "Add" above to add specifications</div>Example specifications:<div>• Bedrooms: 3</div><div>• Balcony: Yes'],
            name: ['Name', '@Name'],
            yesNo: ['Yes/No', '@Yes/No'],
            number: ['Number', '@Number'],
            currencySettings: ['Currency Settings', '@Currency Settings'],
            defaultCurrency: ['Default Currency', '@Default Currency'],
            currentExchangeRate: ['Current Exchange Rate', '@Current Exchange Rate'],
            lastUpdated: ['Last Updated', '@Last Updated'],
            updateNow: ['Update Now', '@Update Now'],
            rate: ['Rate', '@Rate'],
            checkHistoricalRate: ['Check Historical Rate', '@Check Historical Rate'],
            getRate: ['Get Rate', '@Get Rate'],
            recentExchangeRates: ['Recent Exchange Rates', '@Recent Exchange Rates'],
            hide: ['Hide', '@Hide'],
            show: ['Show', '@Show'],
            from: ['From', '@From'],
            to: ['To', '@To'],
            clear: ['Clear', '@Clear'],
            first: ['First', '@First'],
            previous: ['Previous', '@Previous'],
            pageOf: (currentPage: number, totalPages: number) => {
              if (LangCode == 0) {
                return 'Page ' + currentPage + ' of ' + totalPages;
              } else if (LangCode == 1) {
                return '@Page ' + currentPage + ' of ' + totalPages;
              }
            },
            next: ['Next', '@Next'],
            last: ['Last', '@Last'],
            offlineExchangeRatesError: ['Please connect to internet to see exchange rates', '@Please connect to internet to see exchange rates'],
            formatingNumbers: ['Formating numbers', '@Formating numbers'],
            makeLongNumbers: ['Make long numbers like 100,000, 1,000,000 or 10,000,000 to short numbers like 100K, 1M or 10M', '@Make long numbers like 100,000, 1,000,000 or 10,000,000 to short numbers like 100K, 1M or 10M'],
            currency: ['Currency', '@Currency'],
            decimalPlaces: ['Decimal Places', '@Decimal Places'],
            decimalPlacesPlaceholder: ['2', '@2'],
            decimalSeparator: ['Decimal Separator', '@Decimal Separator'],
            decimalSeparatorPlaceholder: ['.', '@.'],
            thousandSeparator: ['Thousand Separator', '@Thousand Separator'],
            thousandSeparatorPlaceholder: [',', '@,'],
            numberOfDecimalPlacesToShow: ['Number of decimal places to show', '@Number of decimal places to show'],
            abbreviateNumbers: ['Abbreviate Numbers', '@Abbreviate Numbers'],
            emailSettings: ['Email Settings', '@Email Settings'],
            representativeEmails: ['Representative Emails', '@Representative Emails'],
            enterEmailAndPressSpaceEnterOrComma: ['Enter email and press Space, Enter or Comma', '@Enter email and press Space, Enter or Comma'],
            representativePhoneNumbers: ['Representative Phone Numbers', '@Representative Phone Numbers'],
            landlordDisplayName: ['Landlord Display Name', '@Landlord Display Name'],
            phoneNumbersMustBeAtLeast10Digits: ['Phone numbers must be at least 10 digits', '@Phone numbers must be at least 10 digits'],
            landlordDisplayNameDescription: ['The name that is visible in emails and sms sent to the tenant', '@The name that is visible in emails and sms sent to the tenant'],
            landlordPhoneNumberDescription: ['The phone number that is visible in emails and sms sent to the tenant', '@The phone number that is visible in emails and sms sent to the tenant'],
            landlordEmail: ['Landlord Email', '@Landlord Email'],
            landlordEmailDescription: ['The email address that is visible in emails and sms sent to the tenant', '@The email address that is visible in emails and sms sent to the tenant'],
            landlordPhoneNumber: ['Landlord Phone Number', '@Landlord Phone Number'],
            offlineSettingsChangeError: ['Please connect to internet to change these settings', '@Please connect to internet to change these settings'],
            downloadAllFiles: ['Download All Files', '@Download All Files'],
            downloadAllFilesDescription: ['Download all files for the selected user', '@Download all files for the selected user'],
            downloadAllFilesError: ['Error downloading files:', '@Error downloading files:'],
            downloadAllFilesSuccess: ['Files downloaded successfully', '@Files downloaded successfully'],
            sending: ['Sending...', '@Sending...'],
            submit: ['Submit', '@Submit'],
            suggestAFeature: ['Suggest a feature', '@Suggest a feature'],
            featureSuggestionPlaceholder: ['Tell us what features you would like to see in RentMaster...', '@Tell us what features you would like to see in RentMaster...'],
            reviewPlaceholder: ['Tell us what you think about RentMaster...', '@Tell us what you think about RentMaster...'],
        }, mainPage: {
            min: ['Min', '@Min'],
            max: ['Max', '@Max'],
            numberOfFloors: ['Number of floors', '@Number of floors'],
            roomsPerFloor: ['Rooms per floor', '@Rooms per floor'],
            continue: ['Continue', '@Continue'],
            roomLimitReachedSignUp: ['Room limit reached. Please sign up to add more rooms.', '@Room limit reached. Please sign up to add more rooms.'],
            roomLimitReachedUpgrade: ['Room limit reached. Please upgrade to add more rooms.', '@Room limit reached. Please upgrade to add more rooms.'],
            addARoomImages: ['Add a room images', '@Add a room images'],
            newRoomImagesFolder: ['New Room Images Folder', '@New Room Images Folder'],
            floorAndRoom(AddRoomFormFloor:number, AddRoomFormRoomIndex:number) {
                if (LangCode == 0) {
                    return 'Floor ' + AddRoomFormFloor + ', Room ' + AddRoomFormRoomIndex;
                } else if (LangCode == 1) {
                    return '@Floor ' + AddRoomFormFloor + ', Room ' + AddRoomFormRoomIndex;
                }
            },
            addRooms: ['Add Rooms', '@Add Rooms'],
            takenRoomDeleteError: ['You can not delete a room that is taken', '@You can not delete a room that is taken'],
            confirmDelete: ['Confirm Delete', '@Confirm Delete'],
            deleteThisRoom: ['Delete this room', '@Delete this room'],
            paymentCycle: ['Payment Cycle', '@Payment Cycle'],
            monthly: ['Monthly', '@Monthly'],
            weekly: ['Weekly', '@Weekly'],
            daily: ['Daily', '@Daily'],
            thirty: ['30', '@30'],
            fifteen: ['15', '@15'],
            seven: ['7', '@7'],
            annually: ['Annually', '@Annually'],
            customDays: ['Custom', '@Custom'],
            customDaysPlaceholder: ['10', '@10'],
            price: ['Price', '@Price'],
            close: ['Close', '@Close'],
            numberOfFloors: ['Number of floors', '@Number of floors'],
            roomsPerFloor: ['Rooms per floor', '@Rooms per floor'],


        }, expensePage: {
            resetfilters: ['Reset filters', '@Reset filters'],
            addExpense: ['Add Expense', '@Add Expense'],
            addExpenseDescription: ['Add an expense to the selected room', '@Add an expense to the selected room'],
            expenseName: ['Expense Name', '@Expense Name'],
            expenseNamePlaceholder: ['Rent', '@Rent'],
            expenseAmount: ['Expense Amount', '@Expense Amount'],
            expenseAmountPlaceholder: ['1000', '@1000'],
            expenseDate: ['Expense Date', '@Expense Date'],
            expenseDatePlaceholder: ['2024-01-01', '@2024-01-01'],
            expenseDescription: ['Expense Description', '@Expense Description'],
            expenseDescriptionPlaceholder: ['Rent for January', '@Rent for January'],
            expenseCategory: ['Expense Category', '@Expense Category'],
            expenseCategoryPlaceholder: ['Rent', '@Rent'],
            expenseMemo: ['Expense Memo', '@Expense Memo'],
            expenseMemoPlaceholder: ['Rent for January', '@Rent for January'],
            expenseNotes: ['Expense Notes', '@Expense Notes'],
            expenseNotesPlaceholder: ['Rent for January', '@Rent for January'],
            expensePaymentCycle: ['Expense Payment Cycle', '@Expense Payment Cycle'],
            
        },
    },
    web: {
      download: ['Download', '@Download'],
      getstarted: ['Get Started', '@Get Started'],
      slogan: [
        'Simplifying property management for landlords and property managers.',
        '@Simplifying property management for landlords and property managers.',
      ],
      navbar: {
        home: ['Home', '@Home'],
        features: ['Features', '@Features'],
        pricing: ['Pricing', '@Pricing'],
        about: ['About', '@About'],
        faq: ['FAQ', '@FAQ'],
        contact: ['Contact', '@Contact'],
        quicklinks: ['Quick Links', '@Quick Links'],
      },
      about: {
        values: {
          innovationTitle: ['Innovation', '@Innovation'],
          innovationDescription: [
            'Pioneering smart solutions that revolutionize property management',
            '@Pioneering smart solutions that revolutionize property management',
          ],
          customerFocusTitle: ['Customer Focus', '@Customer Focus'],
          customerFocusDescription: [
            'Dedicated to making property management easier for our clients',
            '@Dedicated to making property management easier for our clients',
          ],
          excellenceTitle: ['Excellence', '@Excellence'],
          excellenceDescription: [
            'Committed to delivering top-tier solutions and support',
            '@Committed to delivering top-tier solutions and support',
          ],
        },
        mission: {
          missionTitle: ['Our Mission', '@Our Mission'],
          missionDescription: [
            'To simplify property management through an innovative system \
                    that helps property owners manage their rooms efficiently, \
                    communicate with tenants effectively through SMS, and scale \
                    their business with ease.',
            '@To simplify property management through an innovative system \
                    that helps property owners manage their rooms efficiently, \
                    communicate with tenants effectively through SMS, and scale \
                    their business with ease.',
          ],
        },
        about: ['About', 'ስለ'],
      },
    },
  }
};
export default tl;
