const {
  withDangerousMod,
  withAndroidManifest,
} = require("expo/config-plugins");
const fs = require("node:fs");
const path = require("node:path");
module.exports = function (config) {
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
    const permissions = manifest["uses-permission"] ?? [];
    if (process.env.BOLO_DEV_NETWORK !== "1")
      manifest["uses-permission"] = [
        ...permissions.filter(
          (p) => p.$["android:name"] !== "android.permission.INTERNET",
        ),
        {
          $: {
            "android:name": "android.permission.INTERNET",
            "tools:node": "remove",
          },
        },
      ];
    manifest.application[0].$["android:allowBackup"] = "false";
    return config;
  });
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const source = path.join(config.modRequest.projectRoot, "assets/models");
      const target = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/assets/models",
      );
      fs.mkdirSync(target, { recursive: true });
      fs.cpSync(source, target, { recursive: true });
      return config;
    },
  ]);
};
