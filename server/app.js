// server/app.js
import http       from 'http';
import express    from 'express';
import cors       from 'cors';
import cookieParser from 'cookie-parser';
import { initSocket } from './middleware/socketIo.js';

import authRouter     from './routers/authRouter.js';
import menuRouter     from './routers/menuRouter.js';
import ordersRouter   from './routers/ordersRouter.js';  // unchanged
import recommend      from './routers/recommend.js';
import checkoutRouter from './routers/checkoutRouter.js';
import kitchenRouter  from './routers/kitchenRouter.js'
import adminRouter    from './routers/adminRouter.js'

import { isKitchen } from './middleware/isKitchen.js';
import { authenticate } from './middleware/authenticate.js';
const app    = express();
const server = http.createServer(app);

app.use(cors({ origin:'http://localhost:5173', credentials:true }));
app.use(express.json());
app.use(cookieParser());

app.use('/auth',    authRouter);
app.use('/menu',    menuRouter);
app.use('/recommend',recommend);
app.use('/checkout',checkoutRouter);
app.use('/admin', adminRouter);

// ─── initialize io *before* mounting orders ─────────────────
const io = initSocket(server);

io.on('connection', socket => {
  console.log('🔌 Socket connected', socket.id);
});

app.use('/orders', ordersRouter);
app.use('/kitchen', authenticate, isKitchen, kitchenRouter)
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server on ${PORT}`));
