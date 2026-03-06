const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getUsers, getUser, updateUser, archiveUser, deleteUser } = require('../controllers/userController');

const router = Router();

router.use(authenticate);

router.get('/', getUsers);
router.get('/:id', getUser);
router.patch('/:id', authorize('ADMIN'), updateUser);
router.patch('/:id/archive', authorize('ADMIN'), archiveUser);
router.delete('/:id', authorize('ADMIN'), deleteUser);

module.exports = router;
