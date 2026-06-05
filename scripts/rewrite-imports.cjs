#!/usr/bin/env node
// PR2 Stage D v4: 用"反推 OLD 位置"修正 import 路径
// 关键:对每个文件,先用 REVERSE_PREFIX_MAP 推出 OLD 文件位置,
//      再用 OLD 位置解析 import,再用 PREFIX_REMAP 求 NEW 目标,最后算 NEW 相对路径
const fs = require('fs');
const path = require('path');

// 1) OLD 绝对路径前缀 → NEW 绝对路径前缀(顺序:长的优先)
const PREFIX_REMAP = [
  // 文件级(精确路径)
  ['src/common/contexts/AuthContext', 'src/features/auth/contexts/AuthContext'],
  ['src/common/contexts/ThemeContext', 'src/features/theme/contexts/ThemeContext'],
  ['src/common/contexts/GrowthContext', 'src/shared/contexts/GrowthContext'],
  ['src/common/utils/goalUtils', 'src/features/goals/utils/goalUtils'],
  // slices
  ['src/store/slices/authSlice', 'src/features/auth/store/authSlice'],
  ['src/store/slices/goalSlice', 'src/features/goals/store/goalSlice'],
  ['src/store/slices/reminderSlice', 'src/features/reminders/store/reminderSlice'],
  ['src/store/slices/themeSlice', 'src/features/theme/store/themeSlice'],
  // growthSlice 暂留原位,身份映射
  ['src/store/slices/growthSlice', 'src/store/slices/growthSlice'],
  // 整目录(短前缀兜底)
  ['src/common/hooks', 'src/shared/hooks'],
  ['src/common/i18n', 'src/shared/i18n'],
  ['src/common/types', 'src/shared/types'],
  ['src/common/utils', 'src/shared/utils'],
  ['src/components/common', 'src/shared/components/common'],
  ['src/components/growth-tree', 'src/features/growth-tree/components'],
  ['src/components/ErrorBoundary', 'src/shared/components/ErrorBoundary'],
  ['src/components/KeyboardShortcutsHelp', 'src/shared/components/KeyboardShortcutsHelp'],
  ['src/components/Tutorial', 'src/shared/components/Tutorial'],
  ['src/pages/auth/index', 'src/features/auth/pages/LoginPage'],
  ['src/pages/records/index', 'src/features/records/pages/RecordsPage'],
  ['src/pages/growth-tree/index', 'src/features/growth-tree/pages/GrowthTreePage'],
  ['src/pages/goals/index', 'src/features/goals/pages/GoalsPage'],
  ['src/pages/reminders/index', 'src/features/reminders/pages/RemindersPage'],
  ['src/pages/analytics/index', 'src/features/analytics/pages/AnalyticsPage'],
  ['src/pages/dashboard/index', 'src/features/dashboard/pages/DashboardPage'],
  ['src/pages/Home', 'src/features/dashboard/pages/HomePage'],
  ['src/pages/auth', 'src/features/auth/pages'],
  ['src/pages/records', 'src/features/records/pages'],
  ['src/pages/growth-tree', 'src/features/growth-tree/pages'],
  ['src/pages/goals', 'src/features/goals/pages'],
  ['src/pages/reminders', 'src/features/reminders/pages'],
  ['src/pages/analytics', 'src/features/analytics/pages'],
  ['src/pages/dashboard', 'src/features/dashboard/pages'],
  ['src/store', 'src/app/store'],
  ['src/common', 'src/shared'],
  ['src/components', 'src/shared/components'],
  ['src/pages', 'src/features'],
  ['src/App', 'src/app/App'],
  ['src/main', 'src/app/main'],
];

// 2) NEW 绝对路径前缀 → OLD 绝对路径前缀(顺序:长的优先)
//    用它反推每个文件曾经在哪里
const REVERSE_PREFIX_REMAP = [
  ['src/app/App', 'src/App'],
  ['src/app/main', 'src/main'],
  ['src/features/auth/contexts/AuthContext', 'src/common/contexts/AuthContext'],
  ['src/features/auth/store/authSlice', 'src/store/slices/authSlice'],
  ['src/features/auth/pages/LoginPage', 'src/pages/auth/index'],
  ['src/features/auth/pages', 'src/pages/auth'],
  ['src/features/records/pages/RecordsPage', 'src/pages/records/index'],
  ['src/features/records/pages', 'src/pages/records'],
  ['src/features/goals/store/goalSlice', 'src/store/slices/goalSlice'],
  ['src/features/goals/utils/goalUtils', 'src/common/utils/goalUtils'],
  ['src/features/goals/pages/GoalsPage', 'src/pages/goals/index'],
  ['src/features/goals/pages', 'src/pages/goals'],
  ['src/features/reminders/store/reminderSlice', 'src/store/slices/reminderSlice'],
  ['src/features/reminders/pages/RemindersPage', 'src/pages/reminders/index'],
  ['src/features/reminders/pages', 'src/pages/reminders'],
  ['src/features/theme/contexts/ThemeContext', 'src/common/contexts/ThemeContext'],
  ['src/features/theme/store/themeSlice', 'src/store/slices/themeSlice'],
  ['src/features/growth-tree/pages/GrowthTreePage', 'src/pages/growth-tree/index'],
  ['src/features/growth-tree/components', 'src/components/growth-tree'],
  ['src/features/growth-tree/pages', 'src/pages/growth-tree'],
  ['src/features/analytics/pages/AnalyticsPage', 'src/pages/analytics/index'],
  ['src/features/analytics/pages', 'src/pages/analytics'],
  ['src/features/dashboard/pages/DashboardPage', 'src/pages/dashboard/index'],
  ['src/features/dashboard/pages/HomePage', 'src/pages/Home'],
  ['src/features/dashboard/pages', 'src/pages/dashboard'],
  ['src/shared/contexts/GrowthContext', 'src/common/contexts/GrowthContext'],
  ['src/shared/hooks', 'src/common/hooks'],
  ['src/shared/i18n', 'src/common/i18n'],
  ['src/shared/types', 'src/common/types'],
  ['src/shared/utils', 'src/common/utils'],
  ['src/shared/components/common', 'src/components/common'],
  ['src/shared/components/ErrorBoundary', 'src/components/ErrorBoundary'],
  ['src/shared/components/KeyboardShortcutsHelp', 'src/components/KeyboardShortcutsHelp'],
  ['src/shared/components/Tutorial', 'src/components/Tutorial'],
  ['src/app/store', 'src/store'],
  ['src/shared', 'src/common'],
];

const ROOT = process.cwd();

function reverseMapPath(newAbs) {
  const noExt = newAbs.replace(/\.(ts|tsx|js|jsx|json)$/, '');
  for (const [newPrefix, oldPrefix] of REVERSE_PREFIX_REMAP) {
    const newPrefixNoExt = newPrefix.replace(/\.(ts|tsx|js|jsx|json)$/, '');
    if (noExt === newPrefixNoExt || noExt.startsWith(newPrefixNoExt + '/')) {
      return oldPrefix + noExt.slice(newPrefixNoExt.length);
    }
  }
  return null;
}

function findNewAbsPrefix(oldAbs) {
  const noExt = oldAbs.replace(/\.(ts|tsx|js|jsx|json)$/, '');
  for (const [oldPrefix, newPrefix] of PREFIX_REMAP) {
    const oldPrefixNoExt = oldPrefix.replace(/\.(ts|tsx|js|jsx|json)$/, '');
    if (noExt === oldPrefixNoExt || noExt.startsWith(oldPrefixNoExt + '/')) {
      return newPrefix + noExt.slice(oldPrefixNoExt.length);
    }
  }
  return null;
}

function toRelative(fromFile, newAbs) {
  const fromDir = path.dirname(fromFile);
  let rel = path.relative(fromDir, newAbs);
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel.split(path.sep).join('/');
}

const importRe = /(from\s+['"])(\.\.?\/[^'"]+)(['"])/g;
const dynamicImportRe = /(import\s*\(\s*['"])(\.\.?\/[^'"]+)(['"]\s*\))/g;
const sideEffectImportRe = /(^|[\s;])(import\s+['"])(\.\.?\/[^'"]+)(['"])/gm;

function rewriteFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  let changes = 0;
  // file 是 NEW 绝对路径,推 OLD
  const newAbs = file.startsWith(ROOT) ? file.slice(ROOT.length + 1) : file;
  const mappedOld = reverseMapPath(newAbs);
  const oldAbs = mappedOld || newAbs; // 没动过 → OLD == NEW
  const oldDir = path.dirname(path.join(ROOT, oldAbs));
  // 通用路径替换:输入 p (相对路径),输出新的相对路径(或 null 表示不需改)
  function mapImportPath(p) {
    const oldTarget = path.normalize(path.resolve(oldDir, p));
    const relOld = oldTarget.startsWith(ROOT) ? oldTarget.slice(ROOT.length + 1) : oldTarget;
    // 1) 目标在 OLD 位置仍存在(没搬迁)→ 直接用 OLD 位置算 NEW 相对
    let newTargetAbs;
    if (fs.existsSync(oldTarget)) {
      newTargetAbs = oldTarget;
    } else {
      // 2) 目标被搬走了 → 走 PREFIX_REMAP
      const newTarget = findNewAbsPrefix(relOld);
      if (!newTarget) {
        if (process.env.DEBUG) console.log('  [skip]', newAbs, p, '-> relOld:', relOld);
        return null;
      }
      // 保留原扩展名(若 newTarget 不含扩展名但 p 含)
      let newTargetWithExt = newTarget;
      const oldExt = p.match(/\.(ts|tsx|js|jsx|json|css)$/)?.[0];
      if (oldExt && !newTargetWithExt.endsWith(oldExt)) {
        newTargetWithExt = newTargetWithExt + oldExt;
      }
      newTargetAbs = path.join(ROOT, newTargetWithExt);
    }
    const rel = toRelative(file, newTargetAbs);
    if (process.env.DEBUG) console.log('  [edit]', p, '->', rel);
    return rel;
  }
  const replace = (re) => (m, pre, p, post) => {
    const rel = mapImportPath(p);
    if (rel === null) return m;
    changes++;
    return pre + rel + post;
  };
  const sideEffectReplace = (m, pre, kw, p, post) => {
    const rel = mapImportPath(p);
    if (rel === null) return m;
    changes++;
    return pre + kw + rel + post;
  };
  let out = src.replace(importRe, replace(importRe));
  out = out.replace(dynamicImportRe, replace(dynamicImportRe));
  out = out.replace(sideEffectImportRe, sideEffectReplace);
  if (changes > 0) {
    fs.writeFileSync(file, out);
    console.log(`[${changes} edits] ${newAbs}`);
  }
  return changes;
}

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

const files = walk(path.join(ROOT, 'src'));
let totalChanges = 0;
for (const f of files) {
  if (f.endsWith('.bak')) continue;
  totalChanges += rewriteFile(f);
}
console.log(`\nTotal: ${totalChanges} import(s) rewritten across ${files.length} file(s)`);
