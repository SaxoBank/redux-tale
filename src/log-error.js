function getErrorObject(value) {
    if (value && value.stack) {
        return {
            message: 'Unhandled exception in tale: ' + value,
            stack: value.stack,
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
