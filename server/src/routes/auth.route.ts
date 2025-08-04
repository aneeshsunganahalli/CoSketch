import express from 'express';
import { loginUser, logoutUser, registerUser, verifyUser } from '../controllers/authController';

const authRouter = express.Router();

authRouter.post('/register', registerUser);
authRouter.post('/login', loginUser);
authRouter.post('/logout', logoutUser);
authRouter.get('/verify', verifyUser);

export default authRouter;
