module.exports = {
  apps: [{
    name: 'jobportal',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    exec_mode: 'fork'
  }]
}
