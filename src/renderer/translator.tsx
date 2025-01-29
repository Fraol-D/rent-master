const tl = {
    gen:{
        changeLanguage: ["Change Language", "ቋንቋ ይቀየር"],
    },
    app: {
        login: ["Log in", "ግባ"],
        signup: ["Sign up", "ተፈረም"],
        submit: ["Submit", "አስገባ"],
        email: ["Email", "ኢመይል"],
        username: ["Username", "መጠቀሚያ ስም"],
        password: ["Password", "ማለፍያ ቃል"],
        fullname: ["Full Name", "ሙሉ ስም"],
        companyname: ["Company Name", "ኩምፓኒያ ስም"],
        phonenumber: ["Phone Number", "ስልክ ቁጥር"],
        back: ["Back", "ተመለስ"],
        verify: ["Verify", "እርግጠኛ ሁን"],
        yes: ["Yes", "አው"],
        no: ["No", "አይ"],
        loginPage: {
            orSignUp: ["Don't have an account? Sign up", "አካውንት የለህም? ወይ ተፈረም"],
            toAdmin: ["Log in to ADMIN", "@Log in to ADMIN"],
            toAdminDescription: ["Log in to ADMIN with account Email and Password", "@Log in to ADMIN with account Email and Password"],
            toAppUser: ["Log in to App User", "@Log in to App User"],
            toAppUserDescription: ["Log in to App User with Username and Password", "@Log in to App User with Username and Password"],
            forgotPassword: ["Forgot password?", "@Forgot password?"],
            rememberMe: ["Remember me", "@Remember me"],
            err: {
                unknownEmail: ["Email could not be found. Please try again.", "@Email could not be found. Please try again."],
                invalidEmail: ["Invalid email or password", "@Invalid email or password"],
                emailNotFound: ["Email could not be found. Please try again.", "@Email could not be found. Please try again."],
                appUserUnauthorizedPassword: ["This AppUser is not allowed to enter with password. Please contact Administrator.", "@This AppUser is not allowed to enter with password. Please contact Administrator."],
                invalidUsername: ["Invalid Username or password", "@Invalid Username or password"],
                general1: ["Error during login:", "@Error during login:"],
                general2: ["An error occurred during login. Please try again.", "@An error occurred during login. Please try again."],
                success: ["Login successful", "@Login successful"]
            }
        },
        signupPage: {
            orLogIn: ["Or Log In", "ወይንም ግባ"],
            passwordOnceMore: ["Repeat password", "ማለፍያ ቃል ይድገሙ"],
            signUpDescription: ["Sign up with your Email and Password", "@Sign up with your Email and Password"],
            verifCodeSent: ["Verification code sent to your email", "@Verification code sent to your email"],
            enterCode: ["Enter Code", "@Enter Code"],
            resendCode: ["Resend code", "@Resend code"],
            verifSuccess: ["Verification successful! <br /> Now enter your info", "@Verification successful! <br /> Now enter your info"],

        },
        navbar: {
            tabs: {
                dashboard: ["Dashboard", "@Dashboard"],
                rooms: ["Rooms", "@Rooms"],
                expenses: ["Expenses", "@Expenses"],
                tools: ["Tools", "@Tools"]
            },
            upload: {
                uploadButton(ChangeMade:number, uploadProgress:number, LangCode:number) {
                    if (ChangeMade > 0) {
                        if (uploadProgress === 100 || uploadProgress === 0) {
                            if (LangCode == 0) {
                                return "Upload <br /> \
                                <span style={{ fontSize: 'var(--10px-V)' }}> \
                                  " + ChangeMade + " change</span>"
                            } else if (LangCode == 1) {
                                return "@Upload <br /> \
                                <span style={{ fontSize: 'var(--10px-V)' }}> \
                                  " + ChangeMade + " change</span>"
                            }
                        } else if (uploadProgress >= 50) {
                            if (LangCode == 0) {
                                return "Syncing"
                            } else if (LangCode == 1) {
                                return "@Syncing"
                            }
                        } else {
                            if (LangCode == 0) {
                                return "Uploading"
                            } else if (LangCode == 1) {
                                return "@Uploading"
                            }
                        }
                    } else {
                        if (LangCode == 0) {
                            return "No Change"
                        } else if (LangCode == 1) {
                            return "@No Change"
                        }
                    }
                },
                upload: ["Upload", "@Upload"],
                resetOfflineChanges(ChangeMade:number, LangCode:number) {
                    if (LangCode == 0) {
                        return "Reset " + ChangeMade + " Offline Changes";
                    } else if (LangCode == 1) {
                        return "@Reset " + ChangeMade + " Offline Changes";
                    }
                },
                completeSync: ["Complete Sync", "@Complete Sync"],
                sync: ["Sync", "@Sync"],
                alerts: {
                    offline: ["You are currently offline", "@You are currently offline"],

                },
                syncIncomingChanges(OnlineChanges:number, ChangeMade:number, LangCode:number) {
                    if (OnlineChanges === 0 || ChangeMade == null || ChangeMade == undefined || Number.isNaN(ChangeMade)) { 
                        return "<><>"
                    } else if (LangCode == 0) {
                            return "<>Sync {OnlineChanges} incoming changes</>"
                    } else if (LangCode == 1) {
                        return "<>@Sync {OnlineChanges} incoming changes</>"
                    }
                },
                setAsMain: ["Set as main", "@Set as main"],
                setAsMainTitle: ["Synchronizes the local database with the online server, overwriting the server data with the current local data, including any offline changes.", "@Synchronizes the local database with the online server, overwriting the server data with the current local data, including any offline changes."],
                assets: ["Assets", "@Assets"],
                roomAssets: ["(Room Pictures,Documents)", "(@Room Pictures,@Documents)"],
                uploadRoomAssets: ["Upload Room Assets", "@Upload Room Assets"],
                uploadRoomAssetsTitle: ["Synchronize Local Room Assets to Server", "@Synchronize Local Room Assets to Server"],
                downloadRoomAssets: ["Download Room Assets"],
                downloadRoomAssetsTitle: ["Retrieve Room Assets from Server", "@Retrieve Room Assets from Server"],
                backup: ["Backup", "@Backup"],
                createBackup: ["Create Backup", "@Create Backup"],
                createBackupTitle: ["Create Local Data Backup", "@Create Local Data Backup"],
                loadBackup: ["Load Backup", "@Load Backup"],
                loadBackupTitle: ["Restore from Data Backup", "@Restore from Data Backup"],
                revertData: ["Revert to old", "@Revert to old"],
                revertDataTitle: ["Return to Current Main Data", "@Return to Current Main Data"],
                setMainBackup: ["Set as main", "@Set as main"],
                setMainBackupTitle: ["Make This Backup the Main Data", "@Make This Backup the Main Data"],
                refreshData: ["Refresh Data", "@Refresh Data"],
                signOutConfirmation: ["Are you sure you want to sign out?", "@Are you sure you want to sign out?"]
            }
        }
    },
    web: {
        download: ["Download", "@Download"],
        getstarted: ["Get Started", "@Get Started"],
        slogan: ["Simplifying property management for landlords and property managers.", "@Simplifying property management for landlords and property managers."],
        navbar: {
            home: ["Home", "@Home"],
            features: ["Features", "@Features"],
            pricing: ["Pricing", "@Pricing"],
            about: ["About", "@About"],
            faq: ["FAQ", "@FAQ"],
            contact: ["Contact", "@Contact"],
            quicklinks: ["Quick Links", "@Quick Links"]
        },
        about: {
            values: {
                innovationTitle: ["Innovation", "@Innovation"],
                innovationDescription: ["Pioneering smart solutions that revolutionize property management", "@Pioneering smart solutions that revolutionize property management"],
                customerFocusTitle: ["Customer Focus", "@Customer Focus"],
                customerFocusDescription: ["Dedicated to making property management easier for our clients", "@Dedicated to making property management easier for our clients"],
                excellenceTitle: ["Excellence", "@Excellence"],
                excellenceDescription: ["Committed to delivering top-tier solutions and support", "@Committed to delivering top-tier solutions and support"]
            },
            mission: {
                missionTitle: ["Our Mission", "@Our Mission"],
                missionDescription: ["To simplify property management through an innovative system \
                    that helps property owners manage their rooms efficiently, \
                    communicate with tenants effectively through SMS, and scale \
                    their business with ease.",
                    "@To simplify property management through an innovative system \
                    that helps property owners manage their rooms efficiently, \
                    communicate with tenants effectively through SMS, and scale \
                    their business with ease."],
            },
            about: ["About", "ስለ"]
        },
    }
}
export default tl;
