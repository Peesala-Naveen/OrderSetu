# OrderSetu

OrderSetu is a full-stack MERN web application for restaurant ordering and management.  
It helps restaurant owners, chefs, waiters, and customers manage orders efficiently using a single platform.  
The application also includes AI features for menu assistance.

---

## Live Project Links

1. Frontend (Vercel):  
   https://order-setu.vercel.app  

2. Backend API (Render):  
   https://ordersetu-backend.onrender.com  

---

## Features

### 1. Authentication & Roles
- User login and registration  
- Role-based access:
  - Owner  
  - Chef  
  - Waiter  
  - Customer  
- JWT-based authentication  

### 2. Order Management
- Place and manage orders  
- Role-based dashboards  
- Real-time order updates using WebSockets  

### 3. AI Integration
- AI-powered menu description generation  
- Uses Groq API for AI features  

### 4. Responsive UI
- Fully responsive frontend  
- Built with modern React and Vite  

---

## Tech Stack

### Frontend
- React (Vite)  
- React Router  
- JavaScript  
- CSS  
- Deployed on Vercel  

### Backend
- Node.js  
- Express.js  
- MongoDB Atlas  
- JWT Authentication  
- WebSockets  
- Deployed on Render  

---

## Project Structure

### Root
OrderSetu/
├── backend/
├── frontend/
├── package.json
├── package-lock.json
└── README.md


---

### Backend Structure
backend/
├── config/
│ └── connectDB.js
├── controllers/
├── middleware/
├── models/
│ ├── billing_models.js
│ ├── confirmed_orders_models.js
│ ├── menu_models.js
│ ├── request_models.js
│ ├── restaurants_models.js
│ └── workers_models.js
├── routes/
├── socket.js
├── server.js
├── package.json
└── .env


---

### Frontend Structure
frontend/
├── public/
│ ├── OrderSetu_brand_banner.png
│ └── OrderSetu_logo.png
├── src/
│ ├── assets/
│ ├── components/
│ │ ├── addAndEditMenu/
│ │ ├── card/
│ │ ├── editCharges/
│ │ ├── editNoOfTables/
│ │ ├── editProfile/
│ │ ├── editWorkers/
│ │ ├── footer/
│ │ ├── joinRequest/
│ │ └── navbar/
│ ├── Pages/
│ │ ├── chef/
│ │ ├── customer/
│ │ ├── home/
│ │ ├── login/
│ │ ├── owner/
│ │ └── waiter/
│ ├── App.jsx
│ ├── main.jsx
│ ├── index.css
│ └── App.css
├── vite.config.js
├── vercel.json
├── package.json
└── .env


---

## Environment Variables

### Backend (Render)
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://order-setu.vercel.app
GROQ_API_KEY=your_groq_api_key


### Frontend (Vercel)
VITE_BACKEND_URL=https://ordersetu-backend.onrender.com
VITE_LINKEDIN_URL=https://www.linkedin.com/in/naveen-peesala-b41019301/
VITE_MAIL=naveenpeesala2004@gmail.com
VITE_GITHUB_URL=https://github.com/Peesala-Naveen


---

## Important Deployment Notes
- Backend is deployed on Render  
- Frontend is deployed on Vercel  
- MongoDB is hosted on MongoDB Atlas  
- CORS is configured to allow only the deployed frontend  
- SPA routing issue is fixed using Vercel rewrite rules  

---

## SPA Routing Fix (Vercel)
To avoid 404 errors on page refresh, this configuration is used:

`frontend/vercel.json`
{
"rewrites": [
{
"source": "/(.*)",
"destination": "/index.html"
}
]
}


---

## How to Run Locally

### Backend
#cd backend
#npm install
#npm start

### Frontend
cd frontend
npm install
npm run dev


---

## Author

Peesala Naveen  
Computer Science Engineering (AI & DS) 
SASTRA University  
GitHub:  
https://github.com/Peesala-Naveen  
LinkedIn:  
https://www.linkedin.com/in/naveen-peesala-b41019301/  

---

## Status
Project is fully deployed and working in production environment.


---

## Login credentials for Testing:

Owner:  
Mail : raja@gmail.com   
Password : Raja@123     
Chef:   
Mail : bunny@gmail.com   
Password : Bunny@123   
Waiter:   
MAil : akash@gmail.com   
Password : Akash@123   
**Customer to select the Restaurant for Testing : Raja Restaurant**     
  




