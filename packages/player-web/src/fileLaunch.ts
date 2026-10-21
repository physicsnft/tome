/**
 * Double-clicking a .course file on a computer. Once Tome is installed from Chrome or Edge, the manifest's
 * `file_handlers` make it the app for .course files (Windows, macOS, Linux, ChromeOS). The operating system
 * starts Tome, or focuses the window already open (`launch_handler`), and hands the files over through
 * `launchQueue`. Each file is checked and added exactly like one picked with "Add a .course file…".
 *
 * Browsers without the File Handling API (Firefox, Safari) simply never call the consumer.
 */
import { importFile, reportImportError } from './lib/importCourse.ts';

interface LaunchParams { files: { kind: string; name: string; getFile(): Promise<File> }[] }

export function initFileLaunch() {
  const queue = (window as any).launchQueue;
  if (!queue || typeof queue.setConsumer !== 'function') return;
  queue.setConsumer(async (params: LaunchParams) => {
    if (!params.files?.length) return;
    location.hash = ''; // results are shown in the library
    for (const handle of params.files) {
      if (handle.kind !== 'file') continue;
      try { await importFile(await handle.getFile()); }
      catch (e) { reportImportError(handle.name, `Tome could not read ${handle.name}: ${(e as Error).message}.`); }
    }
  });
}
