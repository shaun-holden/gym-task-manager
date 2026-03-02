const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getUsers, getUser, updateUser } = require('../controllers/userController');

const router = Router();

router.use(authenticate);

router.get('/', getUsers);
router.get('/:id', getUser);
router.patch('/:id', authorize('ADMIN'), updateUser);

module.exports = router;
