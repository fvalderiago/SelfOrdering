const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/customer/menu', async (req, res) => {
    const menuItems = await getAllMenuItems();
    const customer = req.session.customer;
    if (!customer) return res.redirect('/login');

    db.query('SELECT foodTypes.foodType, foods.foodID, foods.foodTypeID, foods.foodName, foods.price, foods.description, foods.discount, foods.isFeatured, foods.foodImage FROM foodTypes INNER JOIN foods ON foodTypes.foodTypeID = foods.foodTypeID ORDER BY foodTypes.foodType, foods.foodName', (err, menu) => {
        if (err) return res.status(500).send('Database error');
        res.render('customer/menu', { customer, menu, menuItems });
    });
});

const cartController = require('../controllers/cartController');

router.get('/cart', cartController.showCart);

module.exports = router;