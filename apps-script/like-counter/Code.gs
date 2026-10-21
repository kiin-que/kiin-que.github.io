// Like counter for the "편지 잘 읽었어요" button on kiin-que.github.io.
// Deploy as a web app (Execute as: Me, Who has access: Anyone). It stores one number in script
// properties and touches nothing else, so its public URL can only read or add to that number.
const MAX_LIKES_PER_MINUTE = 30;

function doGet() {
  return json_({ count: count_() });
}

function doPost() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return json_({ error: 'busy', count: count_() });
  try {
    const cache = CacheService.getScriptCache();
    const recent = Number(cache.get('recent') || 0);
    if (recent >= MAX_LIKES_PER_MINUTE) return json_({ error: 'slow down', count: count_() });
    cache.put('recent', String(recent + 1), 60);
    const next = count_() + 1;
    PropertiesService.getScriptProperties().setProperty('count', String(next));
    return json_({ count: next });
  } finally {
    lock.releaseLock();
  }
}

function count_() {
  return Number(PropertiesService.getScriptProperties().getProperty('count') || 0);
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
