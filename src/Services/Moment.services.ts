import moment from 'moment-timezone';

// const DATE_RFC2822 = "ddd, DD MMM YYYY HH:mm:ss [UTC]";
// const DATE_RFC2822_ = "YYYY-MM-DD HH:mm:Z"
// const HumanDate = "DD/MM/YYYY";
// const currentDate = moment().utc().format(DATE_RFC2822)
// const FORMAT = "DD/MM/YYYY HH:mm";

export const FormatDateWithHoursUTCSix = (date: Date) => {
    moment.locale('es'); // Set the locale to Spanish
    let formattedDate = moment(date).utcOffset(-360).format('DD/MMM/YYYY [a las] h:mm A');
    /*
        Keeping the first letter uppercase.
        Converting the next two letters to lowercase.
        Removing the period.
    */
    return formattedDate.replace(/(\w{3})\./, (match, p1) => p1.charAt(0).toUpperCase() + p1.slice(1).toLowerCase());
}


export const FormatDateUTCSix = (date: Date) => {
    moment.locale('es'); // Set the locale to Spanish
    let formattedDate = moment(date).format('DD/MMM/YYYY');
    /*
        Keeping the first letter uppercase.
        Converting the next two letters to lowercase.
        Removing the period.
    */
    return formattedDate.replace(/(\w{3})\./, (match, p1) => p1.charAt(0).toUpperCase() + p1.slice(1).toLowerCase());
}


export const FormatDateForDateFieldsUTCSix = (date: Date) => {
    moment.locale('es'); // Set the locale to Spanish
    let formattedDate = moment(date).utc().format('DD/MMM/YYYY');
    /*
        Keeping the first letter uppercase.
        Converting the next two letters to lowercase.
        Removing the period.
    */
    return formattedDate.replace(/(\w{3})\./, (match, p1) => p1.charAt(0).toUpperCase() + p1.slice(1).toLowerCase());
}