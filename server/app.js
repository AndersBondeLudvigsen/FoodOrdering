import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './routers/authRouter.js';
import menuRouter from './routers/menuRouter.js'
import ordersRouter from './routers/ordersRouter.js'
import recomend from './routers/recomend.js'
import cors from 'cors'
import checkoutRouter from './routers/checkoutRouter.js';


const app = express();
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
  }));

app.use(express.json());
app.use(cookieParser());
app.use('/auth', authRouter);
app.use('/menu', menuRouter)
app.use('/orders', ordersRouter)
app.use('/recommend', recomend)
app.use('/checkout', checkoutRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
