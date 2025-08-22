🍽️ Self-Ordering Restaurant Web Application

A web-based self-ordering system designed to improve the dining experience by allowing customers to choose a table, browse a digital menu, place orders, and make payments directly from their device. The system integrates customers, chefs, and administrators into one platform, streamlining restaurant operations.

🚀 Features

Customer

Choose a table to start ordering

Browse digital menu with categories, prices, and dietary info

Add items to cart, adjust quantities, and checkout

Secure online payments (credit/debit cards, mobile wallets)

Receive real-time order updates

Chef / Kitchen Display

View incoming orders by table and items

Track preparation progress

Update order status (In Progress → Almost Ready → Ready to Serve)

Confirm when orders are served

Admin

Manage menu items, prices, and dietary preferences

Manage table activity and assist customers

Manage user roles (admin, chef)

Process payments if needed

Access reports and order history

🛠️ Tech Stack

Backend: Node.js (Express.js)

Frontend: CSS, JavaScript (EJS templates)

Database: MySQL

Authentication: Express-Session & Bcrypt

Payments: Configurable integration with Stripe/PayPal (optional)

📂 Project Structure
self-ordering-restaurant/
│── app.js               # Main application entry point
│── package.json         # Node dependencies
│── /routes              # Route definitions (orders, admin, payments, etc.)
│── /controllers         # Business logic for each module
│── /views               # EJS templates for UI rendering
│── /public              # Static assets (CSS, JS, images)
│── /config              # DB and environment configurations
│── /sql                 # Database schema and migration scripts

⚙️ Installation & Setup

Clone the repository

git clone https://github.com/yourusername/self-ordering-restaurant.git
cd self-ordering-restaurant


Install dependencies

npm install


Set up database

Create a MySQL database (e.g., self_ordering)

Import the SQL schema from /sql/self_ordering.sql

Update database credentials in .env file

Example .env file:

DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=self_ordering
SESSION_SECRET=yourSecretKey
PORT=3000


Run the application

node app.js


Access the system

Customer Interface: http://localhost:3000

Admin & Kitchen Panel: http://localhost:3000/login

✅ Usage Workflow

Customer chooses table → Digital menu opens

Customer selects items and places order

Order is sent to the kitchen display for chefs

Chefs update preparation status

Staff/Chef confirm when order is served

Admins manage menu, roles, and reports

🔒 Security

Encrypted passwords using bcrypt

Session-based authentication for chefs and admins

Secure payment transactions over HTTPS

Role-based access control

📌 Future Enhancements

Email Verification Process

Secure Payment Integration

Table-specific QR Codes

Customizable Promotions

Customer Feedback & Ratings

👨‍💻 Author

Developed by Frances Go as part of a self-ordering restaurant web application project.