// import this module FIRST in a test file to suppress build logging;
// it must run before any src/config import captures the --quiet flag
process.argv.push('--quiet');
