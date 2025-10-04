const { override, useBabelRc, overrideDevServer } = require("customize-cra");

// fix devServer config
const devServerConfig = () => config => {
  config.allowedHosts = "all";  // Cho phép tất cả host (thay vì [""])
  return config;
};

module.exports = {
  webpack: override(
    useBabelRc()
  ),
  devServer: overrideDevServer(devServerConfig())
};
