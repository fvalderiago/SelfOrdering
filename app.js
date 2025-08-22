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

/* RESET PASSWORD */
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

    const userId = users[0].userId;
    const hashedPassword = await bcrypt.hash(password, 10);

    await connection.query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE userId = ?',
      [hashedPassword, userId]
    );

    connection.release();

    console.log('Full req.body:', req.body);

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

/* Register User */
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

/* ORDER */
app.get('/track-order', (req, res) => {
  if (!req.session.tableId) {
    return res.send(`<script>alert("Please select a table first."); window.location.href = "/order";</script>`);
  }
  res.render('customer/track-order', { tableId: req.session.tableId,  tableName: req.session.tableName, currentRoute: 'track-order' });
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
      req.session.tableName = `Table ${tableId}`;
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


app.post('/checkout', (req, res) => {
  const cart = req.body.cart;
  const specialInstructions = req.body.specialInstructions;
  const tableId = req.session.tableId;

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
        // Estimate wait time (basic rule: 10 min + 5 min per item)
        const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        const etaMinutes = 10 + totalItems * 5;
        const eta = new Date(Date.now() + etaMinutes * 60000);

        const totalPrice = cart.reduce(
          (sum, item) => sum + item.price * item.qty,
          0
        );

        // Build receipt
        const receipt = {
          orderId,
          tableId,
          status: "pending",
          placedAt: new Date(),
          eta: eta.toLocaleTimeString(),
          items: cart.map((i) => ({
            name: i.name,
            qty: i.qty,
            price: i.price,
            subtotal: i.price * i.qty,
            dietary: i.dietary || [],
          })),
          total: totalPrice.toFixed(2),
        };

        res.json({
          success: true,
          message: "Order placed successfully!",
          receipt,
        });
      })
      .catch((err) => {
        console.error("Error during order item insert:", err);
        res.status(500).send("Error saving order details");
      });
  });
});


// Print Receipt
const PDFDocument = require("pdfkit");

app.get('/receipt/:orderId/pdf', (req, res) => {
  const orderId = req.params.orderId;

  const orderSql = `
    SELECT o.orderID, t.tableName, o.status, o.orderTime,
           oi.quantity, f.foodName, f.price
    FROM orders o
    JOIN orderitems oi ON o.orderID = oi.orderID
    JOIN foods f ON oi.productID = f.foodID
    JOIN tables t ON t.id = o.tableNumber
    WHERE o.orderID = ?`;

  conn.query(orderSql, [orderId], (err, rows) => {
    if (err || rows.length === 0) {
      return res.status(404).send("Order not found");
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=receipt-${orderId}.pdf`
    );

    doc.pipe(res);

    // === Header ===
    doc.fontSize(22).text("Curry Steps Restaurant", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(14).text("Thank you for dining with us!", { align: "center" });
    doc.moveDown(1);

    // === Order Info ===
    const order = rows[0];
    doc.fontSize(12);
    doc.text(`Order #: ${order.orderID}`);
    doc.text(`Table: ${order.tableName}`);
    doc.text(`Status: ${order.status}`);
    doc.text(`Placed at: ${new Date(order.orderTime).toLocaleString()}`);
    doc.moveDown();

    // === Divider Line ===
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // === Table Headers ===
    doc.font("Helvetica-Bold");

    const tableTop = doc.y;
    const itemX = 50;
    const qtyX = 300;
    const priceX = 370;
    const subtotalX = 460;

    doc.text("Item", itemX, tableTop);
    doc.text("Qty", qtyX, tableTop, { width: 50, align: "right" });
    doc.text("Price", priceX, tableTop, { width: 70, align: "right" });
    doc.text("Subtotal", subtotalX, tableTop, { width: 80, align: "right" });

    doc.moveDown(0.2);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    // === Table Items ===
    doc.font("Helvetica");
    let total = 0;

    rows.forEach((item) => {
      const subtotal = item.price * item.quantity;
      total += subtotal;

      const y = doc.y + 5; // align all columns
      doc.text(item.foodName, itemX, y, { width: 240 });
      doc.text(item.quantity.toString(), qtyX, y, { width: 50, align: "right" });
      doc.text(`$${item.price.toFixed(2)}`, priceX, y, { width: 70, align: "right" });
      doc.text(`$${subtotal.toFixed(2)}`, subtotalX, y, { width: 80, align: "right" });

      doc.moveDown();
    });

    // === Divider Line ===
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    // === Total ===
    doc.moveDown(0.5);
    doc.fontSize(14).font("Helvetica-Bold");
    doc.text(`TOTAL: $${total.toFixed(2)}`, { align: "right" });
    doc.font("Helvetica");

    // === ETA ===
    const etaMinutes = 10 + rows.reduce((sum, i) => sum + i.quantity, 0) * 5;
    const eta = new Date(Date.now() + etaMinutes * 60000);
    doc.moveDown(1);
    doc.fontSize(12).text(`Estimated Ready Time: ${eta.toLocaleTimeString()}`, {
      align: "center",
    });

    // === Footer ===
    doc.moveDown(2);
    doc.fontSize(10).text(
      "Please present this receipt when collecting your order.",
      { align: "center" }
    );

    doc.end();
  });
});


/* Chef: Track Order */
app.get('/chef/track-order', (req, res) => {
  const { startDate, endDate } = req.query;
  res.render('chef/track-order', { 
    currentRoute: 'chef-track-order',
    startDate: startDate || '',
    endDate: endDate || ''
  });
});


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
    const endDateTime = new Date(new Date(endDate).getTime() + 24*60*60*1000 - 1000); // end of day
    const formattedEndDate = endDateTime.toISOString().slice(0, 19).replace('T', ' ');

    sql += ' AND o.orderTime BETWEEN ? AND ? ';
    params.push(startDate + ' 00:00:00', formattedEndDate);
  }

  sql += `
    GROUP BY oi.orderItemID
    ORDER BY o.orderTime DESC, o.orderID DESC
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


app.get('/chef/chef-menu', async (req, res, next) => {
  try {
    const menuItems = await getAllMenuItems();
    res.render('chef/chef-menu', {
      adminEmail: req.session?.user?.email || 'admin@example.com',
  	  menuItems: await getAllMenuItems()
    });
  } catch (err) { next(err); }
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


const adminRoutes = require('./routes/admin');
app.use('/admin', adminRoutes);

app.get('/admin/view-users', async (req, res) => {
	try {
		const users = await getAllUsers();
		res.render('admin/view-users', {
			adminEmail: req.session?.user?.email || 'admin@example.com',
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

// customer menu
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

/* Table Management */
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
  res.render('chef/chef-report', { currentRoute: 'chef-report' });
});

app.get('/admin/admin-report', (req, res) => {
  res.render('admin/admin-report', { currentRoute: 'admin-report' });
});

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

/* SEARCH */
app.get('/search', (req, res) => {
  const searchTerm = req.query.search || "";
  const query = req.query.food;
  if (!query) {
    return res.redirect("/order-search");
  }

  const sql = `SELECT foods.foodName, foods.price, foods.description, foods.foodImage, foods.discount, foodtypes.foodType
              FROM foods
              INNER JOIN foodtypes ON foods.foodTypeID = foodtypes.foodTypeID
              WHERE foods.foodName LIKE ? 
                OR foods.price LIKE ? 
                OR foods.description LIKE ? 
                OR foodtypes.foodType LIKE ?`;
  conn.query(sql, [`%${query}%`], (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      // Take the first match and redirect
      res.redirect(`/order-search?food=${encodeURIComponent(searchTerm)}`);
    } else {
      res.redirect("/order-search?food=notfound");
    }
  });
});

app.get('/order-search', (req, res) => {
    if (!req.session.tableId) {
      return res.send(`<script>alert("Please select a table first."); window.location.href = "/order";</script>`);
    }
    const searchTerm = '%' + (req.query.search || '') + '%';

    const sql = `
        SELECT foods.foodID, foods.foodName, foods.price, foods.description, foods.foodImage, foodtypes.foodType, foods.discount
        FROM foods
        INNER JOIN foodtypes ON foods.foodTypeID = foodtypes.foodTypeID
        WHERE foods.foodName LIKE ?
           OR foods.description LIKE ?
           OR foodtypes.foodType LIKE ?`;

    conn.query(sql, [searchTerm, searchTerm, searchTerm], (err, menuItems) => {
        if (err) throw err;

        // Get dietary preferences
        conn.query('SELECT * FROM dietary_preferences', (err2, dietaryOptions) => {
            if (err2) throw err2;

            res.render('order-search', { menuItems, dietaryOptions, searchQuery: req.query.search || '' });
        });
    });
});


//This will be used to return to home page after the members logout.
app.get('/logout',(req,res) => {
	req.session.destroy();
	res.redirect('/');
});

app.listen(3000);
console.log('Running at Port 3000');