require('dotenv').config();

const express = require('express')
const app = express()
const connectDB = require('./config/Db');
const userRoutes = require('./routes/UserRoutes')
const walletRoutes = require('./routes/WalletRoutes')

app.use(express.json());

const PORT = process.env.PORT;

// Connect Database
connectDB();

app.use('/api/auth', userRoutes);
app.use('/api/wallet', walletRoutes);

app.listen(PORT,()=>{
  console.log(`Server is running on port ${PORT}`)
});