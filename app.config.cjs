const { expo } = require("./app.json");
module.exports = () => {
  const dev = process.env.BOLO_DEV_NETWORK === "1";
  return {
    ...expo,
    android: {
      ...expo.android,
      permissions: dev
        ? [...expo.android.permissions, "android.permission.INTERNET"]
        : expo.android.permissions,
      blockedPermissions: dev
        ? expo.android.blockedPermissions.filter(
            (p) => p !== "android.permission.INTERNET",
          )
        : expo.android.blockedPermissions,
    },
  };
};
