import path from 'node:path';

// Category derivation modes:
//
// - 'fe-build' (default): joins every folder segment verbatim, byte-identical
//   to webpack fe-build, so AEM policies/templates referencing existing
//   categories keep working after migration.
//
// - 'clean': drops a leading segment equal to projectKey (the template re-adds
//   it) and the AEM `clientlibs` folder segment, so projects whose sources live
//   under a folder named after the projectKey (e.g. `batcom/base/clientlibs/…`
//   with projectKey `batcom`) get a readable category like
//   `batcom.base.author.components.foo` instead of fe-build's duplicated
//   `batcom.batcom.base.clientlibs.author.components.foo`.
//
// The physical output folder (where .content.xml is written) is unaffected in
// both modes; only the category string differs.
function deriveName(folder, { projectKey, clientlibsDir, categoryDerivation = 'fe-build' } = {}) {
  let segments = folder.split(path.sep).filter(Boolean);

  if (categoryDerivation === 'clean') {
    if (projectKey && segments[0] === projectKey) {
      segments = segments.slice(1);
    }

    if (clientlibsDir) {
      segments = segments.filter(segment => segment !== clientlibsDir);
    }
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
