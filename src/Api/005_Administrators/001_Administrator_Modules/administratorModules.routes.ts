import { Router } from "express";
import aH from "express-async-handler";
import { celebrate } from "celebrate";
import Controllers from './administratorModules.controllers';
import Validations from './administratorModules.validations';
import { verifyAdminPermissions } from '../../../Middlewares/001_Permissions.mw.ts/Permissions.mw';

const router = Router({mergeParams: true});

router.get('/', aH(verifyAdminPermissions(  [  {sModuleName: 'Administración', sActionCode: 'READ' }  ]) ), aH(Controllers.getModules));

export default router;