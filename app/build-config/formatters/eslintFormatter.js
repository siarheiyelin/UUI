/**
 * This formatter was created to solve issue with error location isn't clickable in console log of IDE.
 */

const os = require('os');

module.exports = {
    eslintFormatter,
};

function forwardSlashes(pathStr) { return pathStr.replace(/\\/g, '/'); }

function eslintFormatter(results) {
    function getMessageType(message) {
        if (message.fatal || message.severity === 2) {
            return 'Error';
        }
        return 'Warning';

    }
    let output = '',
        total = 0;

    results.forEach(result => {
        const messages = result.messages;
        total += messages.length;

        messages.forEach(message => {
            const severity = getMessageType(message);
            const msg1 = `[eslint] ${severity} in ${forwardSlashes(result.filePath)}${os.EOL}`
            const msg2 = `  at ${forwardSlashes(result.filePath)}:${message.line || 0}:${message.column || 0}${os.EOL}`
            output += msg1;
            output += msg2;
            output += `  - ${message.message}`;
            output += message.ruleId ? ` (${message.ruleId})` : '';
            output += os.EOL;
        });
    });

    if (total > 0) {
        output += `\n${total} problem${total !== 1 ? 's' : ''}`;
    }

    return output;
}
