export function getContextPath() {
    const path = window.location.pathname;
    const htmlIndex = path.toLowerCase().indexOf('.html');
    if (htmlIndex !== -1) {
        const subPath = path.substring(0, htmlIndex);
        const lastSlash = subPath.lastIndexOf('/');
        return subPath.substring(0, lastSlash);
    }
    if (path.endsWith('/')) {
        return path.substring(0, path.length - 1);
    }
    return '';
}
