const express = require('express');
const router = express.Router();
const walletController = require('../controllers/WalletController');
const auth = require('../middleware/Auth');


router.post('/deposit', auth, walletController.deposit);
router.post('/transfer', auth, walletController.transfer);
router.post('/withdraw', auth, walletController.withdraw);
router.post('/link-account', auth, walletController.linkAccount);



module.exports = router;
