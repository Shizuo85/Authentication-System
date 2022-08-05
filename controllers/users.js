const nodemailer = require('nodemailer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/users');
const AppError = require('../utils/appError');

const sendEmail = (options) => {
	let transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			type: 'OAuth2',
			user: process.env.MAIL_USERNAME,
			pass: process.env.MAIL_PASSWORD,
			clientId: process.env.OAUTH_CLIENTID,
			clientSecret: process.env.OAUTH_CLIENT_SECRET,
			refreshToken: process.env.OAUTH_REFRESH_TOKEN,
		},
	});
	let mailOptions = {
		from: process.env.MAIL_USERNAME,
		to: options.email,
		subject: options.subject,
		html: options.message,
	};
	transporter.sendMail(mailOptions);
};
const render = (req, res) => {
	res.render('form');
};

const signToken = (id) =>
	jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN,
	});

const createSendToken = catchAsync(async (user, statusCode, res) => {
	const token = signToken(user._id);
	const cookieOptions = {
		expires: new Date(
			Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
		),
		httpOnly: true,
	};

	user.loggedOut = false;
	await user.save({ validateBeforeSave: false });

	res.cookie('jwt', token, cookieOptions);

	user.password = undefined;
	user.active = undefined;
	user.confirmEmailToken = undefined;
	user.loggedOut = undefined;

	res.status(statusCode).json({
		status: 'success',
		token,
		data: {
			user: user,
		},
	});
});

const signup = catchAsync(async (req, res, next) => {
	const user = await User.create({
		fullName: req.body.fullName,
		email: req.body.email,
		password: req.body.password,
		passwordConfirm: req.body.passwordConfirm,
		role: req.body.role,
	});

	const confirmToken = user.createEmailConfirmToken();
	await user.save({ validateBeforeSave: false });

	//3 send to user mail
	const confirmURL = `${req.protocol}://${req.get(
		'host'
	)}/api/v1/users/confirmEmail/${confirmToken}`;

	const message = `Confirm email address using this <a href=${confirmURL}>Link</a>.`;

	try {
		await sendEmail({
			email: user.email,
			subject: 'Confirm Email Address',
			message,
		});
		createSendToken(user, 200, res);
	} catch (err) {
		user.confirmEmailToken = undefined;
		user.active = true;
		await user.save({ validateBeforeSave: false });
	}
});

const login = catchAsync(async (req, res, next) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return next(new AppError('Please provide email and password', 400));
	}

	const user = await User.findOne({ email }).select('+password +active');

	if (!user || !(await user.correctPassword(password, user.password))) {
		return next(new AppError('Incorrect email or password', 401));
	}

	if (user.active !== true) {
		return next(
			new AppError('Inactive, check email for confirmation link', 401)
		);
	}

	createSendToken(user, 200, res);
});
const forgotPassword = catchAsync(async (req, res, next) => {
	//1 Get user based on email
	const user = await User.findOne({ email: req.body.email });

	if (!user) return next(new AppError('User does not exist', 401));

	//2 Generate the random reset token
	const resetToken = user.createPasswordResetToken();
	await user.save({ validateBeforeSave: false });

	//3 send to user mail
	const resetURL = `${req.protocol}://${req.get(
		'host'
	)}/api/v1/users/resetPassword/${resetToken}`;

	const message = `Forgot your password? Submit a PATCH request with your new password and
     passwordConfirm to: <a href=${resetURL}>Link</a>.\nIf you didn't forget your password, please ignore this email!`;

	try {
		await sendEmail({
			email: user.email,
			subject: 'Your password reset token(valid for 10mins)',
			message,
		});

		res.status(200).json({
			status: 'success',
			message: 'Token sent to mail',
		});
	} catch (err) {
		user.passwordResetToken = undefined;
		user.passwordResetExpires = undefined;
		await user.save({ validateBeforeSave: false });

		return next(
			new AppError('There was an error sending the email. Try again later', 500)
		);
	}
});
const resetPassword = catchAsync(async (req, res, next) => {
	//1 get user based on token
	const hashedToken = crypto
		.createHash('sha256')
		.update(req.params.token)
		.digest('hex');

	const user = await User.findOne({
		passwordResetToken: hashedToken,
		passwordResetExpires: { $gt: Date.now() },
	});
	//2 set new password if user exists and token has not expired
	if (!user) {
		return next(new AppError('Token is invalid or has expired', 400));
	}
	user.password = req.body.password;
	user.passwordConfirm = req.body.passwordConfirm;
	user.passwordResetToken = undefined;
	user.passwordResetExpires = undefined;

	await user.save();

	//3 update changedPasswordAt

	//4 log user in
	createSendToken(user, 200, res);
});

const confirmEmail = catchAsync(async (req, res, next) => {
	//1 get user based on token
	const hashedToken = crypto
		.createHash('sha256')
		.update(req.params.token)
		.digest('hex');

	const user = await User.findOne({
		confirmEmailToken: hashedToken,
	});

	//2 set new password if user exists and token has not expired
	if (!user) {
		return next(new AppError('Token is invalid', 400));
	}

	user.active = true;
	user.confirmEmailToken = undefined;

	await user.save({ validateBeforeSave: false });
	createSendToken(user, 200, res);
});

const protect = catchAsync(async (req, res, next) => {
	//1). Getting token and check if its there
	let token;
	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith('Bearer')
	) {
		token = req.headers.authorization.split(' ')[1];
	}

	if (!token) {
		return next(
			new AppError('You are not logged in! Please log in to get access', 401)
		);
	}

	//2). Verification of token
	const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

	//3). Checek if user still exists
	const currentUser = await User.findById(decoded.id).select('+loggedOut');
	if (!currentUser) {
		return next(new AppError('The user no longer exists', 401));
	}
	//4). Check if user changed password
	if (currentUser.changedPasswordAfter(decoded.iat)) {
		return next(
			new AppError('User recently changed password, please login again', 401)
		);
	}
	if (currentUser.loggedOut) {
		return next(
			new AppError('You are not logged in! Please log in to get access', 401)
		);
	}

	req.user = currentUser;
	next();
});

const restrictTo = (...roles) => {
	return (req, res, next) => {
		if (!roles.includes(req.user.role)) {
			return next(
				new AppError(`You do not have permission to perform this action`, 403)
			);
		}
		next();
	};
};

const logout = catchAsync(async (req, res, next) => {
	res.cookie('jwt', '', { maxAge: 1 });
	const user = await User.findOne({
		email: req.user.email,
	});
	user.loggedOut = true;
	await user.save({ validateBeforeSave: false });

	res.status(200).json({
		status: 'success',
		message: 'You have successfully logged out',
	});
});

const getUsers = catchAsync(async (req, res, next) => {
	const user = await User.find({})
	res.status(200).json({
		status: 'success',
		results: user.length,
		data: { user },
	});
});

const userRoute = catchAsync(async (req, res, next) => {
	res.status(200).json({
		status: 'success',
		message: 'Welcome User',
	});
});

const staffRoute = catchAsync(async (req, res, next) => {
	res.status(200).json({
		status: 'success',
		message: 'Welcome Staff',
	});
});

const managerRoute = catchAsync(async (req, res, next) => {
	res.status(200).json({
		status: 'success',
		message: 'Welcome Manager',
	});
});

module.exports = {
	render,
	signup,
	login,
	forgotPassword,
	resetPassword,
	confirmEmail,
	protect,
	restrictTo,
	logout,
	getUsers,
	userRoute,
	staffRoute,
	managerRoute,
};
