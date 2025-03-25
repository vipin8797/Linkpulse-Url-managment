// const getIndexFunction = require('./indexFunctions');
// const postIndexFunction = require('./indexFunctions');
const { getIndexFunction, postIndexFunction,
    getAllLinks,
    getEditLink,
    putEditLink,
    getEditQr,
    putEditQr,
    deleteQr,
    getAnalyticsasync,
    getSummaryasync
 } = require('./indexFunctions');





 
module.exports = {getIndexFunction,postIndexFunction,
    getAllLinks,
    getEditLink,
    putEditLink,
    getEditQr,
    putEditQr,
    deleteQr,
    getAnalyticsasync,
    getSummaryasync
};