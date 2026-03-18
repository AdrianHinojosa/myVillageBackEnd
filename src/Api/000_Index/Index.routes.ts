// Dependencies
import aH from 'express-async-handler';
import { Application, Response, Request, NextFunction } from 'express';
import { celebrate } from 'celebrate';

// Middlewares
import Language from '../../Middlewares/Language.mw';
import { LanguageParams } from '../../Middlewares/Validations.mw';

// Routes
import CountriesRoutes from '../001_Countries/countries.routes';
import CitiesRoutes from '../002_Cities/cities.routes';
import AuthenticationRoutes from '../003_Authentication/authentication.routes';
import AdministratorRoutes from '../005_Administrators/administrators.routes';
import SchoolRoutes from '../022_Schools/schools.routes';
import StudentRoutes from '../023_Students/students.routes';
import GoalRoutes from '../024_Goals/goals.routes';
import TrackingRecordRoutes from '../024_Goals/003_TrackingRecords/trackingRecords.routes';
import IepRoutes from '../025_Ieps/ieps.routes';
import SchoolUserRoutes from '../026_SchoolUsers/schoolUsers.routes';
import ProfileRoutes from '../027_Profile/profile.routes';


function BaseRoute(env: string, module: string): string {
    return `${env}/api/v1/:sLang/${module}`;
}

export default (app: Application, env: string) : void => {
    app.use(BaseRoute(env, 'countries'), celebrate({ params: LanguageParams }), aH(Language()), aH(CountriesRoutes));
    app.use(BaseRoute(env, 'cities'), celebrate({ params: LanguageParams }), aH(Language()), aH(CitiesRoutes));
    app.use(BaseRoute(env, 'auth'), celebrate({ params: LanguageParams }), aH(Language()), aH(AuthenticationRoutes));
    app.use(BaseRoute(env, 'administrators'), celebrate({ params: LanguageParams }), aH(Language()), aH(AdministratorRoutes));
    app.use(BaseRoute(env, 'schools'), celebrate({ params: LanguageParams }), aH(Language()), aH(SchoolRoutes));
    app.use(BaseRoute(env, 'students'), celebrate({ params: LanguageParams }), aH(Language()), aH(StudentRoutes));
    app.use(BaseRoute(env, 'goals'), celebrate({ params: LanguageParams }), aH(Language()), aH(GoalRoutes));
    app.use(BaseRoute(env, 'trackingRecords'), celebrate({ params: LanguageParams }), aH(Language()), aH(TrackingRecordRoutes));
    app.use(BaseRoute(env, 'iep'), celebrate({ params: LanguageParams }), aH(Language()), aH(IepRoutes));
    app.use(BaseRoute(env, 'schoolUsers'), celebrate({ params: LanguageParams }), aH(Language()), aH(SchoolUserRoutes));
    app.use(BaseRoute(env, 'profile'), celebrate({ params: LanguageParams }), aH(Language()), aH(ProfileRoutes));


    app.all(`*`, (req: Request, res: Response, next: NextFunction): object => {
        return res.status(404).json({
            Message: `Route not found!`,
        });
    });
}
