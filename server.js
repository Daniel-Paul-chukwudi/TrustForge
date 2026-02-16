require('dotenv').config()
const express = require('express')
const PORT = process.env.PORT || 1234
const DB = process.env.DB
const cors = require('cors')
const axios = require('axios')
const userRouter = require('./route/userRouter')
const businessRouter = require('./route/businessRouter')
const paymentRouter = require('./route/paymentRouter')
const investorRouter = require ('./route/investorRouter')
const adminRouter = require ('./route/adminRouter')
const meetingRouter = require("./route/meetingRouter")
const notificationRouter = require("./route/notificationRouter")
const kycRouter = require('./route/kycRoute')
const swaggerJSDoc = require('swagger-jsdoc')
const swaggerUi  = require('swagger-ui-express')
const {subEnder} = require('./helper/subchecker')
const {createGoogleMeetLink}= require('./helper/meetingLinks')
const mongoose = require("mongoose")

// console.log(Date.now());
// subEnder()

const app = express()
app.use(express.json())
app.use(cors())



// app.get('/', (req, res) => {
//   res.send('✅ TrustForge backend connected successfully');
// });

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'API Documentation for TrustForge',
    version: '4.1.9',
    description: 'Swagger documentation for the TrustForge backend',
    contact: {
      name: 'TrustForge Support',
      url: 'https://google.com',
    },
  },
  servers: [
    {
      url: 'https://trustforge.onrender.com',
      description: 'Production server',
    },
    {
      url: 'http://localhost:4309',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token as **Bearer <token>**',
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const swaggerOptions = {
  swaggerDefinition,
  apis: ['./route/*.js'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(userRouter);
// app.use(businessRouter);
// app.use(investorRouter);
// app.use(adminRouter);
// app.use(paymentRouter);
// app.use(meetingRouter)
// app.use(notificationRouter)
// app.use(kycRouter)
app.use((error, req, res, next)=>{
  if (error) {
    res.send(error.message)
  }
  next()
})
const Startserver = async ()=>{ 
  mongoose.connect(DB).then(() => {
    console.log('Connected to Database')
    app.listen(PORT, () => {
      console.log('Server is running on Port:', PORT)
    })
  }).catch((error) => {
    console.log('Error connecting to Database', error.message)
  });
};

Startserver();
