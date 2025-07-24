var express = require('express');
var app = express();
var session = require('express-session');
var conn = require('./dbConfig');
const { findUserByUsername, updateUserPassword } = require('./config/db');
app.set('view engine','ejs');
app.use(session({
    secret: 'yoursecret',
    resave: true,
    saveUninitialized: true
}))
app.set('views', __dirname + '/views') 

const { getAllUsers, getAllMenuItems, getFeaturedMenuItems } = require('./config/db');

const methodOverride = require('method-override');
app.use(methodOverride('_method'));

app.use('/public', express.static('public'));
app.use(session({ secret: 'orderSecret', resave: false, saveUninitialized: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  req.session.user = { id: 1, name: 'Admin', role: 'admin' };
  next();
});

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.get('/login', function (req, res){
    res.render('login', { currentRoute: 'login' });
});

app.get('/register',function(req,res){
    res.render("register",{title:'Register', currentRoute: 'register'});
});

// Serve the reset password form page
app.get('/reset-password', (req, res) => {
  res.render('reset-password',{title:'Reset', currentRoute: 'reset'});
});

// Handle form submission
app.post('/reset-password', async (req, res) => {
  const { username, currentPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.send('New password and confirmation do not match.');
  }

  const user = await findUserByUsername(username);

  if (!user) {
    return res.send('User not found.');
  }

  // Verify current password (assuming stored hash in user.passwordHash)
  const bcrypt = require('bcrypt');
  const match = await bcrypt.compare(currentPassword, user.password);
  // if (!match) {
  //   return res.send('Current password is incorrect.');
  // }
  if (user.password !== currentPassword) {
    // return res.send('Current password is incorrect.');
    return res.send(`<script>alert('Current password is incorrect.');history.back();</script>`);
  }


  // Hash new password and update in DB
  const newHash = await bcrypt.hash(newPassword, 10);
  await updateUserPassword(username, newHash); // your DB update function

  // res.send('Password reset successful!');
  res.send(`<script>alert('Password reset successful!');history.back();</script>`);
});



app.get('/forgot-password', (req, res) => {
    res.render('forgot-password', {currentRoute: 'forgot-password'});
});

app.post('/forgot-password', (req, res) => {
    const { email } = req.body;
    
    // TODO: Implement email lookup and send reset instructions logic here

    console.log(`Password reset requested for: ${email}`);
    res.send('If an account with that email exists, reset instructions have been sent.');
});


//This will send a POST request to '/register' which will store 
//the user information in a table.
// app.post('/register', (req, res) => {
//   const { username, email, password } = req.body;

//   if (!username || !password) {
//     return res.send(`<script>alert('Username & password required');history.back();</script>`);
//   }

//   // parameterised query → avoids SQL‑injection
//   const sql =
//     `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'customer')`;

//   conn.query(sql, [username, email, password], (err) => {
//     if (err) {
//       console.error(err);
//       return res.send(`<script>alert('Registration failed');history.back();</script>`);
//     }

//     // show the alert **first**, then send the browser to /
//     res.send(`
//       <script>
//         alert('User registered.');
//         window.location.href = '/';   // “index” page route
//       </script>
//     `);
//   });
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
    // res.render('index', { currentRoute: 'index' });
	res.render('index', {
      currentRoute: 'index',
  	  featuredItems: await getFeaturedMenuItems()
    });
});

//This will check whether the records in the table match with the credentials 
//entered during login.
const bcrypt = require('bcrypt');
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
    conn.query('SELECT * FROM foods', (err, menuItems) => {
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


app.get('/', async function (req, res){
	const featuredItems = await getFeaturedMenuItems();
    // res.render('index', { currentRoute: 'index' });
	res.render('index', {
      currentRoute: 'index',
  	  featuredItems: await getFeaturedMenuItems()
    });
});


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
  res.render('chef/track-order', { currentRoute: 'chef-track-order' });
});

app.get('/api/chef/orders', (req, res) => {
  const sql = `
    SELECT 
      o.orderID,
      t.tableName,
      o.orderTime,
      o.status,
      f.foodName,
      oi.quantity,
      o.specialInstructions,
      GROUP_CONCAT(DISTINCT dp.name) AS dietary
    FROM Orders o
    JOIN Tables t ON o.tableNumber = t.id
    JOIN OrderItems oi ON o.orderID = oi.orderID
    JOIN foods f ON oi.productID = f.foodID
    LEFT JOIN orderitem_dietary_preferences oid ON oid.orderItemID = oi.orderItemID
    LEFT JOIN dietary_preferences dp ON dp.id = oid.dietaryPreferenceID
    WHERE oi.productID <> 0
    GROUP BY oi.orderItemID
    ORDER BY o.orderTime DESC, o.orderID DESC;
  `;

  conn.query(sql, (err, results) => {
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

//     conn.query('SELECT dietaryPreferenceID FROM food_dietary_preferences WHERE foodID = ?', [foodID], (err2, selected) => {
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
//   conn.query('DELETE FROM food_dietary_preferences WHERE foodID = ?', [foodID], (err) => {
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

//This will be used to return to home page after the members logout.
app.get('/logout',(req,res) => {
	req.session.destroy();
	res.redirect('/');
});

app.listen(3000);
console.log('Running at Port 3000');