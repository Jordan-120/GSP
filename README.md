# 📦 GSP-PROJECT

A full-stack JavaScript web application built with **MongoDB**, **MySQL**, **Express**, **React**, and **Node.js**.

---

## Features
- User management with CRUD operations
- RESTful API built with Express, MongoDB and MySQL
- Responsive frontend built with React
- Environment-based configuration using `.env`

---

## Project Structure
GSP-PROJECT/ 
├── backend/       # Express server, routes, models, controllers 
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/ 
│   ├── routes/
│   ├── tests/ 
│   ├── utils/
│   ├── .env 
│   ├── .env.test 
│   ├── app.js
│   └── server.js  
├── frontend      # React app, views (combo of JS, CSS and static HTML)
│   ├── views/ 
│   ├──    ├── homepage/
│   ├──    ├──    ├── guest/ 
│   ├──    ├──    ├── navbar/ 
│   ├──    ├──    ├──    ├── functions/
│   ├──    ├──    ├──    ├── pages/
│   ├──    ├──    ├──    ├── styles/  
│   ├──    ├──    ├──    ├──   ├── page/
│   ├──    ├──    ├──    ├──   ├── text/
│   ├──    ├──    ├──    ├──   ├── viewStyleButtons.js
│   ├──    ├──    ├──    ├──   └── viewStyle.js
│   ├──    ├──    ├──    ├──templates/ 
│   ├──    ├──    ├──    └──users/  
│   ├──    ├──    ├── homeStyleSheet.css
│   ├──    ├──    ├── viewHome.js 
│   ├──    ├──    └── viewHomeShell.html 
│   ├──    └── loginpage/
│   └── utils/
├── node_modules    //You might not have due to size, if not install node.js 
├── .prettierrc 
├── eslint.config.cjs 
├── package.json 
├── package-lock.json 
└── README.md

---

## ⚙️ Setup Instructions

### 1. unzzip the repository


### 2. Install backend dependencies
```bash
cd backend
npm install
```

### 3. Change environment filesfile to your databases for MongoDB and MySQL (.env)
# URL
CLIENT_URL=http://localhost:5000

# MongoDB
MONGO_URI=mongodb://localhost:27017/gsp_mongodb

# MySQL
MYSQL_HOST=localhost
MYSQL_USER=gspadmin
MYSQL_PASSWORD=gspadmin123
MYSQL_DATABASE=gsp_mysqldb
MYSQL_PORT=3306

NODE_ENV=development

# JWT
JWT_SECRET=oursupersecretkey123!@#   
JWT_EXPIRES_IN=1h  


### 4. To run
cd backend
node server.js

go to: http://localhost:5000
http://localhost:5000/home
http://localhost:5000/guest


### 4. To run tests 
#### 4.1. Change environment test file to your test databases for MongoDB and MySQL (.env.test)
# MongoDb - Test
MONGO_URI=mongodb://127.0.0.1:27017/gsp_mongodb_test

# MySQL - Test
MYSQL_HOST=localhost
MYSQL_USER=gspadmin
MYSQL_PASSWORD=gspadmin123
MYSQL_DATABASE=gsp_mysqldb_test
MYSQL_PORT=3306

NODE_ENV=test

#### 4.2. To run the tests
cd backend
npm test


