const express = require('express');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const bodyParser = require('body-parser');
const multer = require('multer');

const userRoute = require('./routes/users');
const connectDB = require('./DB/connect');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./utils/globalErrors');
const catchAsync = require('./utils/catchAsync');

const upload = multer();
const app = express();

 
app.set('view engine', 'pug');
app.set('views', './views');

// for parsing application/json
app.use(bodyParser.json());

// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true }));

app.use(upload.array());

app.get('/', (req, res) => {
	res.send("<h1>Auth_wiki</h1>Sign up <a href='/api/v1/users/signup'>here</a>");
});

//1 Global middlewares
// Set security HTTP headers
app.use(helmet());

//Limit requests from same ip
const limiter = rateLimit({
	max: 100,
	windowMs: 60 * 60 * 1000,
	message: 'Too many requests from this ip, please try again in an hour',
});
app.use('/api', limiter);

//Data sanitization against NoSQL query injection
app.use(mongoSanitize());

//Data sanitization against xss(html code attack)
app.use(xss());

app.use('/api/v1/users', userRoute);

app.use('/api/v1/users/login', express.static("./static_files/Login"))
app.use('/api/v1/users/signup', express.static("./static_files/Signup"))
app.use('/api/v1/users/forgotPassword', express.static("./static_files/ForgotPassword"))
app.use('/api/v1/users/resetPassword/:token', express.static("./static_files/ResetPassword/"))

app.all('*', (req, res, next) => {
	//   const err = new Error(`Can't find ${req.originalUrl} on this server`)
	//   err.status = "fail"
	//   err.statusCode = 404
	next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

const port = process.env.PORT || 3000;
const start = catchAsync(async () => {
	await connectDB(process.env.MONGO_URI);

	app.listen(port, () => {
		console.log(`Server is listening on port ${port}...`);
	});
});

app.use(globalErrorHandler);
start();
