// Publish source for kiin-que.github.io, deployed as a web app from the separate publishing Google account.
// That account only has view access to the shared archive/publish folder, so nothing else in Drive is reachable.
// Fill in PUBLISH_FOLDER_ID in your copy, run setup() once, then deploy (Execute as: Me, Who has access: Anyone).
const PUBLISH_FOLDER_ID = '';
const IMAGE = /\.(jpe?g|png|webp|gif|avif)$/i;

// Stores the folder ID and a random token in script properties, and checks what the account can see.
// Copy the logged token into the PUBLISH_TOKEN secret on GitHub.
function setup() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('PUBLISH_FOLDER_ID', PUBLISH_FOLDER_ID);
  if (!props.getProperty('PUBLISH_TOKEN')) {
    props.setProperty('PUBLISH_TOKEN', Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, ''));
  }
  const root = DriveApp.getFolderById(PUBLISH_FOLDER_ID);
  Logger.log('Folder: ' + root.getName());
  for (const dir of ['notes', 'works']) {
    const folders = root.getFoldersByName(dir);
    let count = 0;
    if (folders.hasNext()) for (const it = folders.next().getFiles(); it.hasNext(); it.next()) count++;
    Logger.log(dir + ': ' + count + ' file(s)');
  }
  Logger.log(root.getParents().hasNext()
    ? 'WARNING: this account can also see the parent folder. Share only archive/publish with it.'
    : 'OK: only the publish folder is visible.');
  Logger.log('PUBLISH_TOKEN: ' + props.getProperty('PUBLISH_TOKEN'));
}

function doGet(e) {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('PUBLISH_TOKEN');
  if (!token || !e || !e.parameter || e.parameter.token !== token) return json_({ error: 'unauthorized' });
  const root = DriveApp.getFolderById(props.getProperty('PUBLISH_FOLDER_ID'));
  if (root.getParents().hasNext()) return json_({ error: 'the publishing account can see more than archive/publish' });
  const files = [];
  for (const dir of ['notes', 'works']) {
    const folders = root.getFoldersByName(dir);
    if (!folders.hasNext()) continue;
    const it = folders.next().getFiles();
    while (it.hasNext()) {
      const file = it.next();
      const name = file.getName();
      if (/\.md$/i.test(name)) files.push({ path: dir + '/' + name, text: file.getBlob().getDataAsString('UTF-8') });
      else if (dir === 'works' && IMAGE.test(name)) files.push({ path: dir + '/' + name, base64: Utilities.base64Encode(file.getBlob().getBytes()) });
    }
  }
  return json_({ files });
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
