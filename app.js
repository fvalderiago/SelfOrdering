require('dotenv').config();
var express = require('express');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const ejs = require('ejs');
const path = require('path');
var app = express();
var session = require('express-session');

const { findUserByUsername, updateUserPassword, getFeaturedFAQs } = require('./config/db');

const methodOverride = require('method-override');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine','ejs');
var conn = require('./dbConfig');

app.use(methodOverride('_method'));

app.use(session({
    secret: 'yoursecret',
    resave: true,
    saveUninitialized: true
}))
app.set('views', __dirname + '/views') 

const { getAllUsers, getAllMenuItems, getFeaturedMenuItems } = require('./config/db');


app.use('/public', express.static('public'));
app.use(session({ secret: 'orderSecret', resave: false, saveUninitialized: true }));


app.use((req, res, next) => {
  req.session.user = { id: 1, name: 'Admin', role: 'admin' };
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.get('/login', function (req, res){
    res.render('login', { currentRoute: 'login' });
});

app.get('/register',function(req,res){
    res.render("register",{title:'Register', currentRoute: 'register'});
});

// MySQL pool connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'self_ordering',
});

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "loaded" : "missing");

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// RESET PASSWORD
app.get('/forgot-password', (req, res) => {
  res.render('forgot-password', { message: null, currentRoute: 'forgot-password' });
});

app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const connection = await pool.getConnection();

    const [users] = await connection.query('SELECT userId FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      connection.release();
      return res.render('forgot-password', { message: 'If the email exists, a reset link has been sent.' });
    }

    const userId = users[0].userId;
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await connection.query('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE userId = ?', [token, expiry, userId]);
    connection.release();

    const resetLink = `http://localhost:3000/reset-password/${token}`;
    const templatePath = path.join(__dirname, 'views', 'reset-email.ejs');
    const emailHtml = await ejs.renderFile(templatePath, { resetLink });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html: emailHtml,
    });

    res.render('forgot-password', { message: 'If the email exists, a reset link has been sent.', currentRoute: 'forgot-password' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

app.get('/reset-password/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const connection = await pool.getConnection();
    const [users] = await connection.query(
      'SELECT userId FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
      [token]
    );
    connection.release();

    if (users.length === 0) {
      return res.send('Reset token is invalid or expired.');
    }

    res.render('reset-password', { token, message: null, currentRoute: 'reset-password' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

app.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.render('reset-password', { token, message: 'Passwords do not match', currentRoute: 'reset-password' });
  }

  try {
    const connection = await pool.getConnection();

    const [users] = await connection.query(
      'SELECT userId FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
      [token]
    );

    if (users.length === 0) {
      connection.release();
      return res.send('Reset token is invalid or expired.');
    }

    console.log('Password to hash:', password);
    const userId = users[0].userId;
    const hashedPassword = await bcrypt.hash(password, 10);

    await connection.query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE userId = ?',
      [hashedPassword, userId]
    );

    connection.release();

    console.log('Full req.body:', req.body);

    // res.send('Password has been reset successfully. You can now log in with your new password.');
    res.send(`
      <script>
        alert('Password has been reset successfully. You can now log in with your new password.');
        window.location.href = '/login';
      </script>
    `);

  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});


// app.get('/forgot-password', (req, res) => {
//     res.render('forgot-password', {currentRoute: 'forgot-password'});
// });

// app.post('/forgot-password', (req, res) => {
//     const { email } = req.body;
    
//     // TODO: Implement email lookup and send reset instructions logic here

//     console.log(`Password reset requested for: ${email}`);
//     res.send('If an account with that email exists, reset instructions have been sent.');
// });



app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !password) {
    return res.send(`<script>alert('Username & password required');history.back();</script>`);
  }

  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash(password, 10);

  const sql = `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'customer')`;

  conn.query(sql, [username, email, hashedPassword], (err) => {
    if (err) {
      console.error(err);
      return res.send(`<script>alert('Registration failed');history.back();</script>`);
    }
    res.send(`
      <script>
        alert('User registered.');
        window.location.href = '/';
      </script>
    `);
  });
});

app.get('/', async function (req, res){
	const featuredItems = await getFeaturedMenuItems();
  const featuredFAQs = await getFeaturedFAQs();
	res.render('index', {
      currentRoute: 'index',
  	  featuredItems: featuredItems,
      featuredFAQs: featuredFAQs
    });
});


//This will check whether the records in the table match with the credentials 
//entered during login.
// const bcrypt = require('bcrypt');
app.post('/auth', async function(req, res) {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.send('Please enter Email and Password!');
  }

  conn.query('SELECT * FROM users WHERE email = ?', [email], async function(error, results) {
    if (error) throw error;

    if (results.length === 0) {
      return res.send(`<script>alert('Incorrect Email Address and/or Password! Please try again.');history.back();</script>`);
    }

    const user = results[0];

    // Compare entered password with stored hashed password
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.send(`<script>alert('Incorrect Email Address and/or Password! Please try again.');history.back();</script>`);
    }

    // Password matches
    req.session.loggedin = true;
    req.session.email = email;
    req.session.role = user.role;
    console.log("User role:", user.role);
    console.log("User name:", user.username);

    res.redirect('/member');
  });
});

//Users can access this if they are logged in
app.get('/member', function (req, res, next) {
	if (req.session.loggedin) {
		console.log("Member only role:", req.session.role);
		if(req.session.role === "admin"){
			res.render('adminOnly', {adminEmail: req.session.email, currentRoute: 'menu' });
		}
		else if(req.session.role === "customer"){
			res.render('customerOnly', {memberEmail: req.session.email, currentRoute: 'menu' });
		}
		else{
			res.render('chefOnly', {chefEmail: req.session.email, currentRoute: 'menu' });

		}
	}
	else {
		res.send('Please login to view this page!');
	}
});

app.get('/menu', function (req,res){
   conn.query("SELECT foodTypes.foodType, foods.foodID, foods.foodTypeID, foods.foodName, foods.price, foods.description, foods.discount, foods.isFeatured, foods.foodImage FROM foodTypes INNER JOIN foods ON foodTypes.foodTypeID = foods.foodTypeID ORDER BY foodTypes.foodType, foods.foodName", function(err,result){
     if (err) throw err;
     console.log(result);
         res.render('menuGaneshan',{title: 'My Menu', menuData:result, currentRoute: 'menu'});
   });
 });


app.get('/restaurants', function (req, res){
    res.render('restaurants', { currentRoute: 'restaurants' });
});

// app.get('/track-order', function (req, res){
//     res.render('track-order', { currentRoute: 'track-order' });
// });

app.get('/track-order', (req, res) => {
  if (!req.session.tableId) {
    return res.send(`<script>alert("Please select a table first."); window.location.href = "/order";</script>`);
  }
  res.render('customer/track-order', { tableId: req.session.tableId, currentRoute: 'track-order' });
});

app.get('/api/customer/orders', (req, res) => {
  const tableId = req.session.tableId;

  if (!tableId) {
    return res.status(400).json({ error: "No table selected." });
  }

  const sql = `
    SELECT o.orderID, o.tableNumber, o.orderTime, o.status, o.specialInstructions,
           i.productID, i.quantity, f.foodName, t.tableName
    FROM tables t 
    JOIN orders o ON o.tableNumber = t.id    
    JOIN orderitems i ON o.orderID = i.orderID
    JOIN foods f ON i.productID = f.foodID
    WHERE o.tableNumber = ?
    AND o.status != 'Completed'
    ORDER BY o.orderTime DESC
  `;

  conn.query(sql, [tableId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching customer orders");
    }
    res.json(results);
  });
});


// app.get('/order',function(req,res){
// 	conn.query("SELECT * FROM foods", function (err, result) {
// 		if (err) throw err;
// 		console.log(result);
// 		res.render('order',{title:'Order Now', menuData: result, currentRoute: 'order'});
// 	});
// });

// Route: Show QR Codes (Tables)
app.get('/order', (req, res) => {
  if (!req.session.tableId) {
    conn.query('SELECT * FROM tables WHERE isOccupied = 0', (err, tables) => {
      if (err) throw err;
      res.render('selectTable', { tables, currentRoute: 'order' });
    });
  } else {
    conn.query('SELECT foodTypes.foodType, foods.foodID, foods.foodTypeID, foods.foodName, foods.price, foods.description, foods.discount, foods.isFeatured, foods.foodImage FROM foodTypes INNER JOIN foods ON foodTypes.foodTypeID = foods.foodTypeID GROUP BY foodTypes.foodType, foods.foodID, foods.foodTypeID, foods.foodName, foods.price, foods.description, foods.discount, foods.isFeatured, foods.foodImage ORDER BY foodTypes.foodType DESC, foods.foodName ASC;', (err, menuItems) => {
      if (err) throw err;
      // res.render('menu', { tableId: req.session.tableId, tableName: req.session.tableName, menuItems, currentRoute: 'order' });

      conn.query('SELECT * FROM dietary_preferences', (err, dietaryOptions) => {
        if (err) throw err;

        res.render('menu', {
          tableId: req.session.tableId,
          tableName: req.session.tableName,
          menuItems,
          dietaryOptions,
          currentRoute: 'order'
        });
      });

    });
  }
});


// app.get('/', async function (req, res){
// 	const featuredItems = await getFeaturedMenuItems();
//     // res.render('index', { currentRoute: 'index' });
// 	res.render('index', {
//       currentRoute: 'index',
//   	  featuredItems: await getFeaturedMenuItems()
//     });
// });


// Route: Set Selected Table
app.post('/order/set-table/:tableId', (req, res) => {
  const tableId = req.params.tableId;

  conn.query('SELECT tableName FROM tables WHERE id = ?', [tableId], (err, result) => {
    if (err) throw err;

    if (result.length > 0) {
      req.session.tableId = tableId;
      req.session.tableName = result[0].tableName;
      console.log("Session set: ", req.session.tableId, req.session.tableName);
    } else {
      req.session.tableId = tableId;
      req.session.tableName = `Table ${tableId}`; // fallback
    }

    res.redirect('/order');
  });
});


// Route: Reset Table (optional)
app.get('/order/reset', (req, res) => {
  req.session.tableId = null;
  req.session.tableName = null;
  res.redirect('/order');
});

app.get('/order/menu/:tableId', async (req, res) => {
    const tableId = req.params.tableId;

    const [table] = await conn.query('SELECT tableName FROM tables WHERE id = ?', [tableId]);
    const menuItems = await getMenuItems();

    res.render('order.ejs', {
        tableId,
        tableName: table[0]?.tableName || `Table ${tableId}`,
        menuItems
    });
});

// app.post('/checkout', (req, res) => {
//   const cart = req.body.cart;
//   const tableId = req.session.tableId;

//   if (!cart || !Array.isArray(cart)) {
//     return res.status(400).send('Invalid cart data');
//   }

//   console.log(`Checkout for table: ${tableId}`);
//   console.log(cart);

//   // Example: Save cart items to database orders table here

//   res.json({ success: true, message: 'Order placed successfully.' });
// });


app.post('/checkout', (req, res) => {
  const cart = req.body.cart;
  const specialInstructions = req.body.specialInstructions;
  const tableId = req.session.tableId;

  console.log("Table ID:", tableId);
  console.log("Cart:", cart);
  console.log("Special Instructions:", specialInstructions);

  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).send('Invalid cart data');
  }

  if (!tableId) {
    return res.status(400).send('No table selected');
  }

  const insertOrderSql = "INSERT INTO orders (tableNumber, status, specialInstructions) VALUES (?, 'pending', ?)";
  conn.query(insertOrderSql, [tableId, specialInstructions], (err, orderResult) => {
    if (err) {
      console.error("Order insert error:", err);
      return res.status(500).send("Error saving order");
    }

    const orderId = orderResult.insertId;
    console.log("New Order ID:", orderId);

    // const orderItemsData = cart.map(item => [orderId, item.id, item.qty]);
    // const insertItemsSql = "INSERT INTO orderitems (orderID, productID, quantity) VALUES ?";

    // conn.query(insertItemsSql, [orderItemsData], (err) => {
    //   if (err) {
    //     console.error("Order items insert error:", err);
    //     return res.status(500).send("Error saving order items");
    //   }

    //   res.json({ success: true, message: "Order placed successfully!" });
    // });

        // Use Promise.all to insert each item sequentially and save dietary prefs
    const insertPromises = cart.map(item => {
      return new Promise((resolve, reject) => {
        const insertItemSql = "INSERT INTO orderitems (orderID, productID, quantity) VALUES (?, ?, ?)";
        conn.query(insertItemSql, [orderId, item.id, item.qty], (err, result) => {
          if (err) return reject(err);

          const orderItemID = result.insertId;
          const dietary = item.dietary || []; // array of dietaryPreferenceIDs

          if (Array.isArray(dietary) && dietary.length > 0) {
            const values = dietary.map(d => [orderItemID, parseInt(d)]);
            const insertDietSql = "INSERT INTO orderitem_dietary_preferences (orderitemID, dietaryPreferenceID) VALUES ?";
            conn.query(insertDietSql, [values], (dietErr) => {
              if (dietErr) return reject(dietErr);
              resolve();
            });
          } else {
            resolve();
          }
        });
      });
    });

    Promise.all(insertPromises)
      .then(() => {
        res.json({ success: true, message: "Order placed successfully!" });
      })
      .catch(err => {
        console.error("Error during order item or dietary insert:", err);
        res.status(500).send("Error saving order details");
      });

  });
});


/* Chef: Track Order */
app.get('/chef/track-order', (req, res) => {
  const { startDate, endDate } = req.query; // optional query params
  res.render('chef/track-order', { 
    currentRoute: 'chef-track-order',
    startDate: startDate || '',
    endDate: endDate || ''
  });
});


// app.get('/api/chef/orders', (req, res) => {
//   const sql = `
//     SELECT 
//       o.orderID,
//       t.tableName,
//       o.orderTime,
//       o.status,
//       f.foodName,
//       oi.quantity,
//       o.specialInstructions,
//       GROUP_CONCAT(DISTINCT dp.name) AS dietary
//     FROM Orders o
//     JOIN Tables t ON o.tableNumber = t.id
//     JOIN OrderItems oi ON o.orderID = oi.orderID
//     JOIN foods f ON oi.productID = f.foodID
//     LEFT JOIN orderitem_dietary_preferences oid ON oid.orderItemID = oi.orderItemID
//     LEFT JOIN dietary_preferences dp ON dp.id = oid.dietaryPreferenceID
//     WHERE oi.productID <> 0
//     GROUP BY oi.orderItemID
//     ORDER BY o.orderTime DESC, o.orderID DESC;
//   `;

//   conn.query(sql, (err, results) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).send("Error fetching chef orders");
//     }
//     res.json(results);
//   });
// });

app.get('/api/chef/orders', (req, res) => {
  const { startDate, endDate } = req.query;

  let sql = `
    SELECT 
      o.orderID,
      t.tableName,
      o.orderTime,
      o.status,
      f.foodName,
      oi.quantity,
      o.specialInstructions,
      f.price,
      GROUP_CONCAT(DISTINCT dp.name) AS dietary
    FROM Orders o
    JOIN Tables t ON o.tableNumber = t.id
    JOIN OrderItems oi ON o.orderID = oi.orderID
    JOIN foods f ON oi.productID = f.foodID
    LEFT JOIN orderitem_dietary_preferences oid ON oid.orderItemID = oi.orderItemID
    LEFT JOIN dietary_preferences dp ON dp.id = oid.dietaryPreferenceID
    WHERE oi.productID <> 0
  `;

  const params = [];

  if (startDate && endDate) {
    // sql += ' AND o.orderTime BETWEEN ? AND ?';
    // params.push(startDate, endDate);
    const endDateTime = new Date(new Date(endDate).getTime() + 24*60*60*1000 - 1000); // end of day
    const formattedEndDate = endDateTime.toISOString().slice(0, 19).replace('T', ' ');

    sql += ' AND o.orderTime BETWEEN ? AND ?';
    params.push(startDate + ' 00:00:00', formattedEndDate);
  }

  sql += `
    GROUP BY oi.orderItemID
    ORDER BY o.orderTime DESC, o.orderID DESC;
  `;

  conn.query(sql, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching chef orders");
    }
    res.json(results);
  });
});


app.post('/api/chef/orders/:orderId/status', (req, res) => {
  const { status } = req.body;
  const { orderId } = req.params;

  const sql = "UPDATE orders SET status = ? WHERE orderID = ?";
  conn.query(sql, [status, orderId], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error updating status");
    }
    res.json({ success: true });
  });
});


/*-----------Dietary Preferences---------------*/
// Get all dietary preferences
app.get('/admin/view-dietary', (req, res) => {
  conn.query('SELECT id, name, description FROM dietary_preferences ORDER BY id', (err, results) => {
    if (err) return res.status(500).send('Database error');
    res.render('admin/view-dietary', { dietaryOptions: results });
  });
});

// Render new dietary preference form
app.get('/admin/dietary/new', (req, res) => {
  res.render('admin/dietary-form', { dietaryOption: {}, formAction: '/admin/dietary', formMethod: 'POST' });
});

// Create dietary preference
app.post('/admin/dietary', (req, res) => {
  const { name, description } = req.body;
  conn.query('INSERT INTO dietary_preferences (name, description) VALUES (?, ?)', [name, description], (err) => {
    if (err) return res.status(500).send('Database error');
    res.redirect('/admin/view-dietary');
  });
});

// Render edit form
app.get('/admin/dietary/:id/edit', (req, res) => {
  const id = req.params.id;
  conn.query('SELECT * FROM dietary_preferences WHERE id = ?', [id], (err, results) => {
    if (err || results.length === 0) return res.status(404).send('Not found');
    res.render('admin/dietary-form', { dietaryOption: results[0], formAction: `/admin/dietary/${id}?_method=PUT`, formMethod: 'POST' });
  });
});

// Update dietary preference
app.put('/admin/dietary/:id', (req, res) => {
  const id = req.params.id;
  const { name, description } = req.body;
  conn.query('UPDATE dietary_preferences SET name = ?, description = ? WHERE id = ?', [name, description, id], (err) => {
    if (err) return res.status(500).send('Database error');
    res.redirect('/admin/view-dietary');
  });
});

// Delete dietary preference
app.delete('/admin/dietary/:id', (req, res) => {
  const id = req.params.id;
  conn.query('DELETE FROM dietary_preferences WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).send('Database error');
    res.redirect('/admin/view-dietary');
  });
});


// // Show form to assign dietary preferences to a food
// app.get('/admin/menus/:foodID/dietary', (req, res) => {
//   const foodID = req.params.foodID;

//   conn.query('SELECT * FROM dietary_preferences', (err, allOptions) => {
//     if (err) throw err;

//     conn.query('SELECT dietaryPreferenceID FROM dietary_preferences WHERE foodID = ?', [foodID], (err2, selected) => {
//       if (err2) throw err2;
//       const selectedIds = selected.map(row => row.dietaryPreferenceID);

//       res.render('admin/assign-dietary', {
//         foodID,
//         allOptions,
//         selectedIds
//       });
//     });
//   });
// });

// // Save assigned dietary preferences
// app.post('/admin/menus/:foodID/dietary', (req, res) => {
//   const foodID = req.params.foodID;
//   const dietary = Array.isArray(req.body.dietary) ? req.body.dietary : [];

//   // Delete old links first
//   conn.query('DELETE FROM dietary_preferences WHERE foodID = ?', [foodID], (err) => {
//     if (err) throw err;

//     if (dietary.length === 0) {
//       return res.redirect('/admin/view-menu');
//     }

//     // Insert new mappings
//     const values = dietary.map(id => [foodID, id]);
//     conn.query('INSERT INTO food_dietary_preferences (foodID, dietaryPreferenceID) VALUES ?', [values], (err2) => {
//       if (err2) throw err2;
//       res.redirect('/admin/view-menu');
//     });
//   });
// });





const adminRoutes = require('./routes/admin');
app.use('/admin', adminRoutes);

app.get('/admin/view-users', async (req, res) => {
	try {
		const users = await getAllUsers();
		res.render('admin/view-users', {
			adminEmail: req.session?.user?.email || 'admin@example.com', // fallback
			users
		});
	} catch (err) {
		console.error('Error fetching users:', err);
		res.status(500).send('Internal Server Error');
	}
});


app.get('/admin/view-menu', async (req, res, next) => {
  try {
    const menuItems = await getAllMenuItems();
    res.render('admin/view-menu', {
      adminEmail: req.session?.user?.email || 'admin@example.com',
  	  menuItems: await getAllMenuItems()
    });
  } catch (err) { next(err); }
});

// customer
app.get('/customer/menu', async (req, res, next) => {
  try {
    const menuItems = await getAllMenuItems();
    res.render('customer/menu', {
      adminEmail: req.session?.user?.email || 'admin@example.com',
  	  menuItems: await getAllMenuItems()
    });
  } catch (err) { next(err); }
});

app.use('/customer', require('./routes/customer'));

/* Tables */
app.get('/admin/view-tables', async (req, res) => {
	try {
		const tables = await getAllTables();
		res.render('admin/view-tables', {
			adminEmail: req.session?.user?.email || 'admin@example.com',
			tables
		});
	} catch (err) {
		console.error('Error fetching users:', err);
		res.status(500).send('Internal Server Error');
	}
});

app.get('/admin/dietary', (req, res) => {
  conn.query('SELECT * FROM dietary_preferences', (err, results) => {
    if (err) return res.status(500).send('DB error');
    res.json(results);
  });
});

app.get('/api/dietary-map', (req, res) => {
  conn.query("SELECT id, name FROM dietary_preferences", (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    const map = {};
    results.forEach(row => map[row.id] = row.name);
    res.json(map);
  });
});


/* FAQs */
app.get('/admin/view-faqs', async (req, res) => {
	try {
		const faqs = await getAllFAQs();
		res.render('admin/view-faqs', {
			adminEmail: req.session?.user?.email || 'admin@example.com',
			faqs
		});
	} catch (err) {
		console.error('Error fetching faqs:', err);
		res.status(500).send('Internal Server Error');
	}
});

/* REPORTS */
app.get('/chef/chef-report', (req, res) => {
  res.render('chef/chef-report', { currentRoute: 'chef-chef-report' });
});

app.get('/admin/admin-report', (req, res) => {
  res.render('admin/admin-report', { currentRoute: 'admin-admin-report' });
});

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

//This will be used to return to home page after the members logout.
app.get('/logout',(req,res) => {
	req.session.destroy();
	res.redirect('/');
});

app.listen(3000);
console.log('Running at Port 3000');