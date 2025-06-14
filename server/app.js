import http       from 'http';
import express    from 'express';
import cors       from 'cors';
import cookieParser from 'cookie-parser';

import authRouter     from './routers/authRouter.js';
import menuRouter     from './routers/menuRouter.js';
import ordersRouter   from './routers/ordersRouter.js';  
import recommend      from './routers/recommendationsRouter.js';
import checkoutRouter from './routers/checkoutRouter.js';
import kitchenRouter  from './routers/kitchenRouter.js';
import adminRouter    from './routers/adminRouter.js';
import favoritsRouter from './routers/favoritesRouter.js';
import nutriRouter    from './routers/nutriRouter.js'

import { isKitchen } from './middleware/isKitchen.js';
import { authenticate } from './middleware/authenticate.js';
import { isAdmin } from './middleware/isAdmin.js';
import { generalLimiter, authLimiter } from './middleware/ratelimiter.js'; 

import { initSocket } from './utils/socketIo.js';

const app    = express();
const server = http.createServer(app);

app.use(cors({ origin:'http://localhost:5173', credentials:true }));
app.use(express.json());
app.use(cookieParser());
app.use(generalLimiter)

app.use('/auth', authLimiter, authRouter);

app.use(authenticate)
app.use('/nutrisions', nutriRouter);
app.use('/menu',    menuRouter);
app.use('/recommendations',recommend);
app.use('/favorites', favoritsRouter)
app.use('/checkout',checkoutRouter);
app.use('/admin', isAdmin, adminRouter);


const io = initSocket(server);

io.on('connection', socket => {
  console.log('🔌 Socket connected', socket.id);
});

app.use('/orders', ordersRouter);
app.use('/kitchen', isKitchen, kitchenRouter)
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server on ${PORT}`));
