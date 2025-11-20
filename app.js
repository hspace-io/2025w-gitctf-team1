const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev')); 

app.get('/', (req, res) => {
  res.send('Team1 Service is Running');
});

app.listen(PORT, () => {
  console.log(`server is running on http://localhost:${PORT}`);
});