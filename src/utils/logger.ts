export function log(level: 'info'|'warn'|'error', ...args: any[]) {
    const prefix = `[${new Date().toISOString()}][${level.toUpperCase()}]`;
    // Color coding (optional)
    let color: string;
    if (level === 'info') color = '\x1b[36m';
    else if (level === 'warn') color = '\x1b[33m';
    else color = '\x1b[31m';
    console.log(color, prefix, ...args, '\x1b[0m');
}

export function logTable(title: string, data: { [key: string]: any }) {
    log('info', `\n=== ${title} ===`);
    Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'object') {
            log('info', `${key}:`);
            Object.entries(value).forEach(([subKey, subValue]) => {
                log('info', `  ${subKey}: ${subValue}`);
            });
        } else {
            log('info', `${key}: ${value}`);
        }
    });
    log('info', '==================\n');
}
