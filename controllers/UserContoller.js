const User = require('../models/UserSchema');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { message } = require('prompt');

dotenv.config();

exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    let user = await User.findOne({ username });
    let userEmail = await User.findOne({email});
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }else if (userEmail) {
      return res.status(400).json({message: 'Email already exists' })
    }

    user = new User({
      email,
      username,
      password,
    });

    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.login = async (req, res) => {
  const { email, username, password } = req.body;

  try {
    let user;

    if (email) {
      user = await User.findOne({ email });
    } else if (username) {
      user = await User.findOne({ username });
    }
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ message: 'Login Successful',  token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
