function testPatternArray(patterns, action) {
    for (let i = 0; i < patterns.length; i++) {
        if (action.type === patterns[i]) {
            return true;
        }
    }
    return false;
}

function testPatternEqual(pattern, action) {
    return pattern === action.type;
}

function functionPatternChecker(pattern, action) {
    return pattern(action);
}

function truthy() {
    return true;
}

export function getPatternChecker(pattern) {
    if (!pattern || pattern === '*') {
        return truthy;
    }
    if (Array.isArray(pattern)) {
        return testPatternArray;
    }
    if (typeof pattern === 'function') {
        return functionPatternChecker;
    }
    return testPatternEqual;
}
