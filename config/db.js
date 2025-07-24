const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'self_ordering',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function updateUserPassword(username, newHashedPassword) {
  await pool.query('UPDATE users SET password = ? WHERE username = ?', [newHashedPassword, username]);
}

async function findUserByUsername(username) {
  const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
  return rows[0];
}

async function getAllUsers() {
  const [rows] = await pool.query('SELECT userId, username, email, role FROM users WHERE role <> "customer" ORDER BY userId');
  return rows;
}

async function promoteUser(id) {
  await pool.query('UPDATE users SET role = "admin" WHERE userId = ?', [id]);
}

async function demoteUser(id) {
  await pool.query('UPDATE users SET role = "chef"  WHERE userId = ?', [id]);
}

async function deleteUser(id) {
  await pool.query('DELETE FROM users WHERE userId = ?', [id]);
}

/* ---------- Tables ---------- */
async function getAllTables() {
  const [rows] = await pool.query('SELECT id, tableName, tableImage, isOccupied FROM tables');
  return rows;
}

async function getTableById(id) {
  const [rows] = await pool.query('SELECT * FROM tables WHERE id = ?', [id]);
  return rows[0];
}

async function createTable({ id, tableName, tableImage, isOccupied }) {
  await pool.query(
    `INSERT INTO tables (id, tableName, tableImage, isOccupied)
     VALUES (?,?,?,?)`,
    [id, tableName, tableImage, isOccupied]
  );
}

async function updateTable(id, { tableName, tableImage, isOccupied }) {
  await pool.query(
    `UPDATE tables
     SET tableName=?, tableImage=?, isOccupied=?
     WHERE id = ?`,
    [tableName, tableImage, isOccupied, id]
  );
}

async function deleteTable(id) {
  await pool.query('DELETE FROM tables WHERE id = ?', [id]);
}

/* ---------- Menu helpers ---------- */
async function getAllMenuItems() {
  const [rows] = await pool.query('SELECT foodTypes.foodType, foods.foodID, foods.foodTypeID, foods.foodName, foods.price, foods.description, foods.discount, foods.isFeatured, foods.foodImage FROM foodTypes INNER JOIN foods ON foodTypes.foodTypeID = foods.foodTypeID ORDER BY foodTypes.foodType, foods.foodName');
  return rows;
}

async function getFeaturedMenuItems() {
  const [rows] = await pool.query('SELECT foodTypes.foodType, foods.foodID, foods.foodTypeID, foods.foodName, foods.price, foods.description, foods.discount, foods.isFeatured, foods.foodImage FROM foodTypes INNER JOIN foods ON foodTypes.foodTypeID = foods.foodTypeID WHERE foods.isFeatured = true ORDER BY foodTypes.foodType, foods.foodName');
  return rows;
}

async function getAllFoodTypes() {
  const [rows] = await pool.query('SELECT foodTypeID, foodType FROM foodtypes ORDER BY foodType');
  return rows; 
}

async function getMenuItemById(id) {
  const [rows] = await pool.query('SELECT * FROM foods WHERE foodID = ?', [id]);
  return rows[0];
}

async function createMenuItem({ foodTypeID, foodName, price, description, discount, isFeatured, foodImage }) {
  await pool.query(
    `INSERT INTO foods (foodTypeID, foodName, price, description, discount, isFeatured, foodImage)
     VALUES (?,?,?,?,?,?,?)`,
    [foodTypeID, foodName, price, description, discount, isFeatured, foodImage]
  );
}

async function updateMenuItem(id, { foodTypeID, foodName, price, description, discount, isFeatured, foodImage }) {
  await pool.query(
    `UPDATE foods
     SET foodTypeID=?, foodName=?, price=?, description=?, discount=?, isFeatured=?, foodImage=?, lastModified = NOW()
     WHERE foodID = ?`,
    [foodTypeID, foodName, price, description, discount, isFeatured, foodImage, id]
  );
}

async function deleteMenuItem(id) {
  await pool.query('DELETE FROM foods WHERE foodID = ?', [id]);
}

module.exports = {
  findUserByUsername,
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
  getFeaturedMenuItems,
  getMenuItemById,
  getAllFoodTypes,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  updateUserPassword
};