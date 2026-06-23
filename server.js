const express = require('express');
const sequelize = require('./config/database');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*app.get('/', (req, res) => {
    res.send('<h1>Adidas E-Commerce API Backend is running!</h1>');
});
*/

const PORT = process.env.PORT || 3000;

// Sync Database models with MySQL server
sequelize.sync({ force: false }) // Use force: true only if you want to drop tables on reset
    .then(() => {
        console.log('Database connected and synced successfully.');
        app.listen(PORT, () => {
            console.log(`Server running smoothly on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });