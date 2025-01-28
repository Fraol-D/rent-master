const tl = {
    gen:{
        changeLanguage: ["Change Language", "ቋንቋ"],
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

        }
    }
}
export default tl;
