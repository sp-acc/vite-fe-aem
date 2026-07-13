// fe-build compatibility stubs.
//
// These config domains are webpack concepts with no vite equivalent in this
// tool. They are kept as empty, mergeable objects so existing .febuild files
// that override them keep loading without errors; the tasks that would have
// consumed them warn once and ignore the values (see utils/warnIgnored.js).
export const babel = {};
export const optimization = {};
export const output = {};
export const plugins = [];
export const stats = {};
export const cache = {};
export const devServer = {};
export const performance = {};
