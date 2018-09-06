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
        // set timeout since jasmine doesn't expect window.onerror to be called from its own context
        setTimeout(() => {
            window.onerror(getErrorObject(error));
        });
    }
}
