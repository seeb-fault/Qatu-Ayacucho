export function opcionesNavegador() {
  const executablePath = process.env.QATU_BROWSER ?? (
    process.platform === 'win32' && !process.env.CI
      ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
      : undefined
  );
  return executablePath ? { executablePath } : {};
}
