import app from "./App";
import moment from 'moment';
import 'moment-timezone';
// Set the default timezone to UTC-6
moment.tz.setDefault('Etc/GMT+6');

/**Variable definitions */
const Port: number | string = process.env.NODE_PORT || 3000;
const ProjectName: string = process.env.PROJECT_NAME;

/**Server Execution */
const server = app.listen(Port, (): void => {
    console.log(
        `${ProjectName} Back-End Running on ${process.env.NODE_ENV
        } API on port ${Port} at ${new Date().toString()}`
    );
});

export default server;