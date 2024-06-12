const User = require('../models/UserSchema');
const axios = require('axios');
const dotenv = require('dotenv');
const Transaction = require('../models/TransactionSchema')

dotenv.config();

exports.deposit = async (req, res) => {
  const { amount, email } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const response = await axios.post(
      process.env.PAYSTACK_URL,
      {
        email: email , 
        amount: amount * 100, 
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (response.data.status) {
      user.balance += amount;
      await user.save();

    const transaction = new Transaction({
      userId, 
      type: 'deposit',
      amount,
    });
    await transaction.save();

      return res.status(200).json({ message: 'Deposit successful', balance: user.balance });
    } else {
      return res.status(400).json({ message: 'Deposit failed' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.transfer = async (req, res) => {
  const { recipientUsername, amount } = req.body;
  const userId = req.user.id;

  try {
    const sender = await User.findById(userId);
    const recipient = await User.findOne({ username: recipientUsername });

    if (!sender || !recipient) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (sender.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    sender.balance -= amount;
    recipient.balance += amount;

    await sender.save();
    await recipient.save();

    const transaction = new Transaction({
      userId,
      type: 'transfer',
      amount,
      recipientId: recipient._id,
    });
    await transaction.save();

    return res.status(200).json({ message: 'Transfer successful', balance: sender.balance });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.withdraw = async (req, res) => {
  console.log("i got here")
  const { amount, username, account_number, bank_code} = req.body;
  const userId = req.user.id;

  if (!amount || !username || !account_number || !bank_code) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }


    if (user.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    
    const recipientResponse = await axios.post(
      process.env.TRANSFER,
      {
        type: 'nuban',
        name: username, 
        account_number: account_number, 
        bank_code: bank_code,
        currency: 'NGN',
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (recipientResponse.data.status) {
      const transferResponse = await axios.post(
        'https://api.paystack.co/transfer',
        {
          source: 'balance',
          amount: amount * 100, // Paystack uses kobo
          recipient: recipientResponse.data.data.recipient_code,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      if (transferResponse.data.status) {
        user.balance -= amount;
        await user.save();

        const transaction = new Transaction({
          userId,
          type: 'withdrawal',
          amount,
        });
        await transaction.save();
        
        return res.status(200).json({ message: 'Withdrawal successful', balance: user.balance });
      } else {
        return res.status(400).json({ message: 'Withdrawal failed' });
      }
    } else {
      return res.status(400).json({ message: 'Recipient creation failed' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }

  exports.linkAccount = async (req, res) =>{
    const { accountNumber, bankCode, accountName } = req.body;
    const userId = req.user.id;
  
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      user.bankAccount = { accountNumber, bankCode, accountName };
      await user.save();
      res.status(200).json({ message: 'Bank account linked successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
};
