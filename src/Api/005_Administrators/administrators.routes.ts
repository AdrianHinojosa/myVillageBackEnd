import { Router } from "express";
import aH from "express-async-handler";
import { celebrate } from "celebrate";
import AdministratorController from './administrators.controller';
import * as AdministratorValidations from './administrators.validations';
import {verifyAdminPermissions, verifyOwnAdminOrAdminPermissions} from '../../Middlewares/001_Permissions.mw.ts/Permissions.mw'
import ModulesRoutes from './001_Administrator_Modules/administratorModules.routes';

type Permission = {
    sModuleName: string;
    sActionCode: 'WRITE' | 'READ' | 'FORBIDDEN';
  };

const router = Router();

router.use('/modules',  aH(ModulesRoutes));

// Done
router.post('/',  aH(verifyAdminPermissions(  [  {sModuleName: 'Administración', sActionCode: 'WRITE' }  ])), celebrate({ body: AdministratorValidations.CreateAdministratorBody }), aH(AdministratorController.createAdministrator));

// GET ALL Administrators
router.get('/', aH(verifyAdminPermissions(  [  {sModuleName: 'Administración', sActionCode: 'READ' }  ])),  celebrate({ query: AdministratorValidations.GetAdministratorsQuery }),  aH(AdministratorController.getAdministrators));

// GET ONE Administrator | Profile
router.get('/:sAdministratorId', aH(verifyOwnAdminOrAdminPermissions(  [  {sModuleName: 'Administración', sActionCode: 'READ' }  ])),  celebrate({ params: AdministratorValidations.GetAdministratorParams }),  aH(AdministratorController.getOneAdministrator));

// Update Administrator
router.put('/:sAdministratorId', aH(verifyAdminPermissions(  [  {sModuleName: 'Administración', sActionCode: 'WRITE' }  ])),  celebrate({ body: AdministratorValidations.UpdateAdministratorBody  , params: AdministratorValidations.UpdateAdministratorParams }),  aH(AdministratorController.updateAdministrator));

// PATCH Administrator bPlatformAccess
router.patch('/:sAdministratorId', aH(verifyAdminPermissions(  [  {sModuleName: 'Administración', sActionCode: 'WRITE' }  ])),  celebrate({ body: AdministratorValidations.PatchAdministratorAccessBody  , params: AdministratorValidations.UpdateAdministratorParams }),  aH(AdministratorController.patchAdministratorAccess));

// DELETE Administrator
router.delete('/:sAdministratorId', aH(verifyAdminPermissions(  [  {sModuleName: 'Administración', sActionCode: 'WRITE' }  ])),  celebrate({ params: AdministratorValidations.DeleteAdministratorParams }),  aH(AdministratorController.deleteAdministrator));



export default router;