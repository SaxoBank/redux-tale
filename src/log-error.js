function getErrorObject(value) {
    if (value && value.stack) {
        return {
            message: 'Unhandled exception in tale: ' + value,
            stack: value.stack,
            logAsInfo: value.logAsInfo,
            isNetworkError: value.isNetworkError,

        };
    }
    
    if (value && value.error && value.error.message && value.error.stack) {
        return {
            message: 'Unhandled exception in tale: ' + value.error.message,
            stack: value.error.stack,
        };
    }

    if (typeof value === 'object') {
        return {
            message: 'Unhandled exception in tale: ' + JSON.stringify(value),
        };
    }

    return {
        message: 'Unhandled exception in tale: ' + value,
    };
}

export function logError(error) {
    if (window.onerror) {
        const errObj = getErrorObject(error);
        window.onerror(errObj.message, '', 0, 0, errObj);
    }
}
