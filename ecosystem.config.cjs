module.exports = {
    apps: [
      {
        name: 'ZACC Zimbabwe',
        port: '3012',
        exec_mode: 'cluster',
        instances: '1',
        script: './.output/server/index.mjs' 
      }
    ]
  }