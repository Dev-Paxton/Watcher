![](https://img.shields.io/github/package-json/version/Dev-Paxton/Watcher?style=for-the-badge)

# About
Discord Bot which can inform you about the downtime of your services.

# Usage
Requires:
- MongoDB
- NodeJS & npm

### Setup
#### MongoDB
Inside mongosh:
```shell
$ use Watcher
$ db.createUser({user:"watcher", pwd:"[SecurePassword]", roles: [{role: "readWrite", db:"Watcher"}]})
```

#### Bot
```shell
$ git clone https://github.com/Dev-Paxton/Watcher.git
$ cd Watcher
$ npm install
# Fill out config/prod.json
$ npm run deploy
```

### Start the Bot
```shell
$ npm start
```