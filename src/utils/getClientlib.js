import path from 'node:path';

// Derive the clientlib category from the folder path.
//
// fe-build joined every folder segment verbatim and let the template prepend
// projectKey, which for projects whose sources live under a folder named after
// the projectKey (e.g. `batcom/base/clientlibs/...` with projectKey `batcom`)
// produced a duplicated, verbose category like
// `batcom.batcom.base.clientlibs.author.components.foo`.
//
// We drop a leading segment equal to projectKey (the template re-adds it) and
// the AEM `clientlibs` folder segment, yielding `batcom.base.author.components.foo`.
function deriveName(folder, { projectKey, clientlibsDir } = {}) {
  let segments = folder.split(path.sep).filter(Boolean);

  if (projectKey && segments[0] === projectKey) {
    segments = segments.slice(1);
  }

  if (clientlibsDir) {
    segments = segments.filter(segment => segment !== clientlibsDir);
  }

  return segments.join('.');
}

export default function getClientlib(original, options = {}) {
  const folder = path.dirname(original);
  const fileName = path.basename(original);
  const name = deriveName(folder, options);
  const extension = original.split('.').pop();

  return {
    folder,
    name,
    fileName,
    extension,
  };
}
