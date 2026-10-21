// Publish source for kiin-que.github.io, deployed as a web app from the separate publishing Google account.
// That account only has view access to the shared archive/publish folder, so nothing else in Drive is reachable.
// Script properties (Project Settings → Script properties):
//   PUBLISH_FOLDER_ID  ID of the shared archive/publish folder
//   PUBLISH_TOKEN      long random value; the same value is stored as the PUBLISH_TOKEN secret on GitHub
const IMAGE = /\.(jpe?g|png|webp|gif|avif)$/i;

function doGet(e) {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('PUBLISH_TOKEN');
  if (!token || !e || !e.parameter || e.parameter.token !== token) return json_({ error: 'unauthorized' });
  const root = DriveApp.getFolderById(props.getProperty('PUBLISH_FOLDER_ID'));
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
