/**
 * Returns a promise that resolves after the provided number of ms, using setTimeout
 * @param ms
 * @param value
 * @returns {Promise}
 */
export default function delay(ms, value) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(value);
        }, ms);
    });
}
