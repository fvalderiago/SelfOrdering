const router = require('express').Router();
const methodOverride = require('method-override');
const { isAdmin } = require('../middleware/auth');
const {
  getAllUsers,
  promoteUser,
  demoteUser,
  deleteUser,
  getAllTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable,
  getAllMenuItems,
  getAllFoodTypes,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} = require('../config/db');
const uploadFood  = require('../config/uploadFood'); 
const uploadTable  = require('../config/uploadTable'); 

router.use(methodOverride('_method'));

/* ------------- List users ------------- */
router.get('/view-users', async (req, res, next) => {
  try {
    const users = await getAllUsers();
    res.render('admin/view-users', {
      adminEmail: req.session?.user?.email || 'admin@example.com', // fallback
      users
    });
  } catch (err) { next(err); }
});

/* ------------- Promote ------------- */
router.post('/users/:id/promote', async (req, res, next) => {
  try {
    await promoteUser(req.params.id);
    res.redirect('/admin/view-users');
  } catch (err) { next(err); }
});

/* ------------- Demote ------------- */
router.post('/users/:id/demote', async (req, res, next) => {
  try {
    await demoteUser(req.params.id);
    res.redirect('/admin/view-users');
  } catch (err) { next(err); }
});

/* ------------- Delete ------------- */
router.delete('/users/:id', async (req, res, next) => {
  try {
    console.log('DELETE route hit with id:', req.params.id);
    await deleteUser(req.params.id);
    res.redirect('/admin/view-users');
  } catch (err) { next(err); }
});



/* ------------- List tables ------------- */
router.get('/view-tables', async (req, res, next) => {
  try {
    const tables = await getAllTables();
    console.log(tables);
    res.render('admin/view-tables', { tables });
  } catch (err) { next(err); }
});


/* ---------- New‑table form ---------- */
router.get('/tables/new', async (req, res, next) => {
  console.log('GET /admin/tables/new route hit');
  try {
    const tables = await getAllTables();
    res.render('admin/new-table', { tables });
  } catch (err) { next(err); }
});

/* ---------- Create ---------- */
router.post('/tables', uploadTable.single('tableImage'), async (req, res, next) => {
  try {
    const isOccupied = req.body.isOccupied ? 1 : 0; 
    const imagePath = req.file ? `/uploads/tables/${req.file.filename}` : null;
    await createTable({ ...req.body, isOccupied: isOccupied, tableImage: imagePath });
    res.redirect('/admin/view-tables');
  } catch (err) { next(err); }
});

/* ---------- Edit form ---------- */
router.get('/tables/:id/edit', async (req, res, next) => {
  try {
    const [table, foodTypes] = await Promise.all([
      getTableById(req.params.id)
    ]);
    if (!table) return next();          // 404 fallback
    res.render('admin/edit-table', { table });
  } catch (err) { next(err); }
});

router.put('/tables/:id', uploadTable.single('tableImage'), async (req, res, next) => {
  try {
    const table   = await getTableById(req.params.id);
    const isOccupied = req.body.isOccupied ? 1 : 0; 
    const imagePath  = req.file
                      ? `/uploads/tables/${req.file.filename}`
                      : table.tableImage;
    await updateTable(req.params.id, { ...req.body, isOccupied: isOccupied, tableImage: imagePath });
    res.redirect('/admin/view-tables');
  } catch (err) { next(err); }
});

/* ---------- Delete ---------- */
router.delete('/tables/:id', async (req, res, next) => {
  try {
    await deleteTable(req.params.id);
    res.redirect('/admin/view-tables');
  } catch (err) { next(err); }
});







/* ---------- List menu items ---------- */
router.get('/view-menu', async (req, res, next) => {
  try {
    const menuItems = await getAllMenuItems();
    console.log(menuItems);
    res.render('admin/view-menu', { menuItems });
  } catch (err) { next(err); }
});


/* ---------- New‑item form ---------- */
router.get('/menus/new', async (req, res, next) => {
  console.log('GET /admin/menus/new route hit');
  try {
    const foodTypes = await getAllFoodTypes();
    res.render('admin/new-menu', { foodTypes });
  } catch (err) { next(err); }
});

/* ---------- Create ---------- */
router.post('/menus', uploadFood.single('foodImage'), async (req, res, next) => {
  try {
    const isFeatured = req.body.isFeatured ? 1 : 0; 
    const imagePath = req.file ? `/uploads/foods/${req.file.filename}` : null;
    await createMenuItem({ ...req.body, isFeatured: isFeatured, foodImage: imagePath });
    res.redirect('/admin/view-menu');
  } catch (err) { next(err); }
});

/* ---------- Edit form ---------- */
router.get('/menus/:id/edit', async (req, res, next) => {
  try {
    const [menuItem, foodTypes] = await Promise.all([
      getMenuItemById(req.params.id),
      getAllFoodTypes()
    ]);
    if (!menuItem) return next();          // 404 fallback
    res.render('admin/edit-menu', { menuItem, foodTypes });
  } catch (err) { next(err); }
});

/* ---------- Update (PUT method‑override) ---------- */
// router.put('/menus/:id', async (req, res, next) => {
//   try {
//     await updateMenuItem(req.params.id, req.body);
//     res.redirect('/admin/view-menu');
//   } catch (err) { next(err); }
// });


router.put('/menus/:id', uploadFood.single('foodImage'), async (req, res, next) => {
  try {
    const menuItem   = await getMenuItemById(req.params.id);
    const isFeatured = req.body.isFeatured ? 1 : 0; 
    const imagePath  = req.file
                      ? `/uploads/foods/${req.file.filename}`
                      : menuItem.foodImage;
    await updateMenuItem(req.params.id, { ...req.body, isFeatured: isFeatured, foodImage: imagePath });
    res.redirect('/admin/view-menu');
  } catch (err) { next(err); }
});

/* ---------- Delete ---------- */
router.delete('/menus/:id', async (req, res, next) => {
  try {
    await deleteMenuItem(req.params.id);
    res.redirect('/admin/view-menu');
  } catch (err) { next(err); }
});


/* ---------- ORDERS ---------- */
const QRCode = require('qrcode');

router.get('/admin/qr-codes', async (req, res, next) => {
  try {
    const baseUrl = req.protocol + '://' + req.get('host'); // e.g. http://localhost:3000
    const totalTables = 10; // or fetch from DB/config

    // Generate QR code data URLs for each table
    const qrCodes = [];
    for (let tableNum = 1; tableNum <= totalTables; tableNum++) {
      const url = `${baseUrl}/order?table=${tableNum}`;
      const qrCodeDataUrl = await QRCode.toDataURL(url);
      qrCodes.push({ tableNum, qrCodeDataUrl, url });
    }

    res.render('admin/qr-codes', { qrCodes });
  } catch (err) {
    next(err);
  }
});


router.get('/dashboard', (req, res) => {
  res.render('admin/dashboard');
});

module.exports = router;