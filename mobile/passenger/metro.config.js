// metro.config.js — позволяет Metro подхватывать модули из ../../shared/
// (single source of truth для карты, API и пр.)
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Метро смотрит на shared/ — изменения там вызывают hot reload
config.watchFolders = [path.resolve(workspaceRoot, "shared")];

// Подсказка где искать node_modules при импорте из shared/
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

config.resolver.disableHierarchicalLookup = false;

module.exports = config;
