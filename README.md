# Authentication-System
 An authentication system, with the following features; Register, Login, Logout (using bcrypt to hash password), users, staff, manager, and  admin roles, protected role based routes with JSON web token, password recovery

#Link to project demo:
https://replit.com/@Shizuo85/Login-and-Signup-with-jwt#index.js

### How to run
- Clone the repo and open the folder using vscode or any other ide of choice
- Run npm install in your terminal to install packages in package.json
- Create a config.env file and fill in values for the following variables:
MONGO_URI,
NODE_ENV,
PORT,
JWT_SECRET,
JWT_EXPIRES_IN,
JWT_COOKIE_EXPIRES_IN,
MAIL_USERNAME,
MAIL_PASSWORD,
OAUTH_CLIENTID,
OAUTH_CLIENT_SECRET,
OAUTH_REFRESH_TOKEN,
-Finally run npm start in your terminal

### Endpoints
The following endpoints are available on this server:
- `/api/v1/users/sigup`: registers a new user.
- `/api/v1/users/login`: logs in a user.
- `/api/v1/users/logout`: logs out a user(protected route).
- `/api/v1/users/forgotPassword`: to get reset password url.
- `/api/v1/users/resetPassword/:token`: to reset password.
- `/api/v1/users/confirmEmail/:token`: to confirm email after signup.
- `/api/v1/users/adminRoute`: protected route for only admin which gets all current users.
- `/api/v1/users/managerRoute`: protected route for only manager.
- `/api/v1/users/staffRoute`: protected route for only staff.
- `/api/v1/users/userRoute`: protected route for only user.


### Endpoints demo on postman
The following endpoints are available on this server:
- `/api/v1/users/sigup`:
-Success: ![signupSuccess](https://user-images.githubusercontent.com/89656114/183018844-93610b57-6cad-414a-b8f3-8dc2399b68a1.PNG)
-Fail: ![signupFail](https://user-images.githubusercontent.com/89656114/183018891-67e020ac-a06c-4d08-ae45-d416efc14391.PNG)

- `/api/v1/users/login`:
-Success: ![loginSuccess](https://user-images.githubusercontent.com/89656114/183018953-e521a990-b425-4cb6-b0ee-9d81954cfd9e.PNG)
-Fail: ![loginFail](https://user-images.githubusercontent.com/89656114/183019003-2729266e-2c9f-4731-8561-7ac697b80442.PNG)

- `/api/v1/users/logout`:
-Success: ![logoutSuccess](https://user-images.githubusercontent.com/89656114/183019065-0f8534d0-4c5a-4412-8bf0-d9385a7e281d.PNG)
-Fail: ![logoutFail](https://user-images.githubusercontent.com/89656114/183019103-a0c972f5-5253-412f-bd39-2bde66518806.PNG)

- `/api/v1/users/forgotPassword`:
-Success: ![forgotPasswordSuccess](https://user-images.githubusercontent.com/89656114/183019224-1458227b-dde8-4489-b00c-1a27cb4672f2.PNG)
-Fail: ![forgotPasswordFail](https://user-images.githubusercontent.com/89656114/183019252-37c83558-6e69-45d0-bddf-692505b42cfc.PNG)

- `/api/v1/users/resetPassword/:token`:
-Success: ![resetPasswordSuccess](https://user-images.githubusercontent.com/89656114/183019323-f0620221-ec96-4d72-8868-6cb2aee73fda.PNG)
-Fail: ![resetPasswordFail](https://user-images.githubusercontent.com/89656114/183019376-03eb391e-427a-4c52-9c29-31d159b7c7b8.PNG)

- `/api/v1/users/confirmEmail/:token`:
-Success: ![confirmEmailSuccess](https://user-images.githubusercontent.com/89656114/183019621-88584763-9a9b-405f-9497-9dd92bebd0b9.PNG)
-Fail: ![confirmEmailFail](https://user-images.githubusercontent.com/89656114/183019550-43baf761-1605-489e-96a5-969a33723fa8.PNG)

- `/api/v1/users/restrictedRoute:
-Success: ![restrictedRouteSuccess](https://user-images.githubusercontent.com/89656114/183019966-7b9dd030-da05-4988-8c07-41da55622272.PNG)
-Fail: ![restrictedRouteFail](https://user-images.githubusercontent.com/89656114/183020019-e3cdfda8-fe43-4b1f-9761-578f608c4b85.PNG)


### Resources
- For Nodemailer, use https://www.freecodecamp.org/news/use-nodemailer-to-send-emails-from-your-node-js-server/ to set up
- For mongoDb url use https://cloud.mongodb.com/v2/62decd80ebe1584627659bea#clusters to set up
