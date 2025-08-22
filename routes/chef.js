const router = require('express').Router();
const methodOverride = require('method-override');
const { isChef } = require('../middleware/auth');
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
  deleteMenuItem,
  getAllFAQs,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
} = require('../config/db');
const uploadFood  = require('../config/uploadFood'); 
const uploadTable  = require('../config/uploadTable'); 

router.use(methodOverride('_method'));







/* ---------- List MENU ITEMS ---------- */
router.get('/chef-menu', async (req, res, next) => {
  try {
    const menuItems = await getAllMenuItems();
    res.render('chef/chef-menu', { menuItems });
  } catch (err) { next(err); }
});


/* ---------- New‑item form ---------- */
router.get('/menus/new', async (req, res, next) => {
  console.log('GET /chef/menus/new route hit');
  try {
    const foodTypes = await getAllFoodTypes();
    res.render('chef/new-menu', { foodTypes });
  } catch (err) { next(err); }
});

/* ---------- Create ---------- */
router.post('/menus', uploadFood.single('foodImage'), async (req, res, next) => {
  try {
    const isFeatured = req.body.isFeatured ? 1 : 0; 
    const imagePath = req.file ? `/uploads/foods/${req.file.filename}` : null;
    await createMenuItem({ ...req.body, isFeatured: isFeatured, foodImage: imagePath });
    res.redirect('/chef/view-menu');
  } catch (err) { next(err); }
});

/* ---------- Edit form ---------- */
router.get('/menus/:id/edit', async (req, res, next) => {
  try {
    const [menuItem, foodTypes] = await Promise.all([
      getMenuItemById(req.params.id),
      getAllFoodTypes()
    ]);
    if (!menuItem) return next();
    res.render('chef/edit-menu', { menuItem, foodTypes });
  } catch (err) { next(err); }
});

router.put('/menus/:id', uploadFood.single('foodImage'), async (req, res, next) => {
  try {
    const menuItem   = await getMenuItemById(req.params.id);
    const isFeatured = req.body.isFeatured ? 1 : 0; 
    const imagePath  = req.file
                      ? `/uploads/foods/${req.file.filename}`
                      : menuItem.foodImage;
    await updateMenuItem(req.params.id, { ...req.body, isFeatured: isFeatured, foodImage: imagePath });
    res.redirect('/chef/view-menu');
  } catch (err) { next(err); }
});

/* ---------- Delete ---------- */
router.delete('/menus/:id', async (req, res, next) => {
  try {
    await deleteMenuItem(req.params.id);
    res.redirect('/chef/view-menu');
  } catch (err) { next(err); }
});


/* ------------- List FAQs ------------- */
router.get('/view-faqs', async (req, res, next) => {
  try {
    const faqs = await getAllFAQs();
    res.render('chef/view-faqs', { faqs });
  } catch (err) { next(err); }
});


/* ---------- New‑faq form ---------- */
router.get('/faqs/new', async (req, res, next) => {
  console.log('GET /chef/faqs/new route hit');
  try {
    const faqs = await getAllFAQs();
    res.render('chef/new-faq', { faqs });
  } catch (err) { next(err); }
});

/* ---------- Create ---------- */
router.post('/faqs', async (req, res, next) => {
  try {
    const isFeatured = req.body.isFeatured ? 1 : 0; 
    const { faqTitle, faqDetail } = req.body;
    if (!faqTitle || !faqDetail) {
      return res.status(400).send('FAQ title and detail are required.');
    }

    await createFAQ({ faqTitle, faqDetail, isFeatured: isFeatured });
    res.redirect('/chef/view-faqs');
  } catch (err) {
    next(err);
  }
});

/* ---------- Edit form ---------- */
router.get('/faqs/:id/edit', async (req, res, next) => {
  try {
    const [faq] = await Promise.all([
      getFAQById(req.params.id)
    ]);
    if (!faq) return next();
    res.render('chef/edit-faq', { faq });
  } catch (err) { next(err); }
});

router.put('/faqs/:id', async (req, res) => {
  const isFeatured = req.body.isFeatured ? 1 : 0; 
  const { faqTitle, faqDetail } = req.body;
  const id = req.params.id;

  await updateFAQ(id, { faqTitle, faqDetail, isFeatured: isFeatured });
  res.redirect('/chef/view-faqs');
});

/* ---------- Delete ---------- */
router.delete('/faqs/:id', async (req, res, next) => {
  try {
    await deleteFAQ(req.params.id);
    res.redirect('/chef/view-faqs');
  } catch (err) { next(err); }
});


router.get('/dashboard', (req, res) => {
  res.render('chef/dashboard');
});

module.exports = router;