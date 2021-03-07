function testPatternArray(patterns, _, action) {
    for (let i = 0; i < patterns.length; i++) {
        const pattern = patterns[i];
        if (typeof pattern === 'function' && typeof pattern.type === 'string') {
            if (action.type === pattern.type) {
                return true;
            }
        } else if (action.type === pattern) {
            return true;
        }
    }
    return false;
}

function testPatternEqual(pattern, _, action) {
    return pattern === action.type;
}

function functionPatternChecker(pattern, _, action) {
    return pattern(action);
}

function toolkitActionPatternChecker(pattern, optionalMatcher, action) {
    return action.type === pattern.type && (!optionalMatcher || optionalMatcher(action));
}

function truthy() {
    return true;
}

export function getPatternChecker(pattern, pattern2ndArg) {
    if (!pattern || pattern === '*') {
        return truthy;
    }
    if (typeof pattern === 'function' && typeof pattern.type === 'string') {
        return toolkitActionPatternChecker;
    }
    if (Array.isArray(pattern)) {
        return testPatternArray;
    }
    if (typeof pattern === 'function') {
        return functionPatternChecker;
    }
    return testPatternEqual;
}
