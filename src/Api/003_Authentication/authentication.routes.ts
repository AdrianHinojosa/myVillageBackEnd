import { Router } from "express";
import aH from "express-async-handler";
import { celebrate } from "celebrate";
import AuthController from './authentication.controllers';
import { verifyOwnUser } from '../../Middlewares/001_Permissions.mw.ts/Permissions.mw';
import * as AuthValidations from './authentication.validations';

const router = Router();

router.post('/login', celebrate({body: AuthValidations.LoginBody}),  aH(AuthController.login));
router.delete('/:sUserId', verifyOwnUser(), aH(AuthController.logout));
router.post('/recovery',  celebrate({body: AuthValidations.RecoveryBody}),  aH(AuthController.sendRecoveryToken));
router.post('/setPassword',   celebrate({body: AuthValidations.SetPasswordBody}),  aH(AuthController.setPasswordByToken));

// Verify User.
router.get('/verify/:sToken',   celebrate({body: AuthValidations.VerifyUserParams}),  aH(AuthController.verifyUserByToken));

export default router;