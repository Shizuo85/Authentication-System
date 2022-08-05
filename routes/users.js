const express = require('express');
const router = express.Router();

const {
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
	managerRoute
} = require('../controllers/users');

router.route('/').get(render);
router.route('/login').post(login);
router.route('/signup').post(signup);
router.route('/forgotPassword').post(forgotPassword);
router.route('/resetPassword/:token').post(resetPassword);
router.route('/confirmEmail/:token').get(confirmEmail);
router.route('/logout').get(protect, logout);
router.route('/adminRoute').get(protect, restrictTo('admin'), getUsers);
router.route('/userRoute').get(protect, restrictTo('user'), userRoute);
router.route('/staffRoute').get(protect, restrictTo('staff'), staffRoute);
router.route('/managerRoute').get(protect, restrictTo('manager'), managerRoute);

module.exports = router;
