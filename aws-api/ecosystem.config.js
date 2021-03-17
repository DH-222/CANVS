module.exports = {
  apps: [{
    name: 'API',
    script: 'app.js',
    args: 'one two',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_DEV: {
      PLACE: 'DEV'
    },
    env_PROD: {
      PLACE: 'PROD'
    },
    env_STAGE: {
      PLACE: 'STAGE'
    }
  }]
};
