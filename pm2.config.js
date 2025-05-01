module.exports = {
    apps: [
      {
        name: 'shope',
        script: 'app.js',
        instances: 'max', // Use as many instances as CPUs available
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
      },
    ],
  };