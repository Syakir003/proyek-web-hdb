// PM2 process file untuk HDB Airconds di VPS.
// Pakai: pm2 start deploy/ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "hdb-airconds",
      script: "./node_modules/.bin/tsx",
      args: "server.ts",
      cwd: "/var/www/hdb-airconds",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
