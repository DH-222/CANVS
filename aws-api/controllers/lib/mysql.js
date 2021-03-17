
const mysql = require('mysql');

module.exports = class MysqlQuery{

  constructor(req){
    this.req = req;
    this.mysqlConfig = this.req.app.get('mysqlConfig');
    this.startMysql();
  }

  startMysql() {
    this.mysqlConnection = mysql.createConnection({
      host: this.mysqlConfig.url,
      user: this.mysqlConfig.user,
      password: this.mysqlConfig.pass,
      database: this.mysqlConfig.db
    });
  };

  closeMysql() {
    this.mysqlConnection.end();
  };

  getActiveMurals(){
    return new Promise((resolve, reject) => {
      this.mysqlConnection.query('SELECT * FROM Murals WHERE active=1', (err, results) => {
        if (err) reject({error: true, message: err});
        this.myqlResults = results;
        this.closeMysql();
        resolve(this.myqlResults);
      });
    });
  };

  getRemovedMurals(){
    return new Promise((resolve, reject) => {
      this.mysqlConnection.query('SELECT * FROM Murals WHERE derelict=1', (err, results) => {
        if (err) reject({error: true, message: err});
        this.myqlResults = results;
        this.closeMysql();
        resolve(this.myqlResults);
      });
    });
  };

  getMuralStats(){
    const { stat, mural } = this.req.params;
    const query = 'SELECT COUNT(\'userIdentifier\') FROM Popularity WHERE userStatement= \'' + stat + '\' AND muralID=' + mural;
    return new Promise((resolve, reject) => {
      this.mysqlConnection.query(query, (err, results) => {
        if (err) reject({error: true, message: err});
        this.closeMysql();
        console.log("results", results);
        const result = results[0]["COUNT('userIdentifier')"];
        resolve(String(result));
      });
    });
  };

  addMuralStat(){
    const { stat, mural, uid } = this.req.params;
    const query = 'INSERT INTO Popularity (userIdentifier, muralID, userStatement) VALUES (\'' + uid + '\', \'' + mural + '\', \'' + stat + '\')';
    return new Promise((resolve, reject) => {
      this.mysqlConnection.query(query, (err, results) => {
        if (err) reject({error: true, message: err});
        this.closeMysql();
        resolve(results);
      });
    });
  };

  deleteMuralStat(){
    const { stat, mural, uid } = this.req.params;
    const query = 'DELETE FROM Popularity WHERE userIdentifier=' + '\'' + uid + '\'' + ' AND muralID=' + mural + ' AND userStatement=' + '\'' + stat + '\'';
    return new Promise((resolve, reject) => {
      this.mysqlConnection.query(query, (err, results) => {
        if (err) reject({error: true, message: err});
        this.closeMysql();
        resolve(results);
      });
    });
  };

  getPopularity(){
    return new Promise((resolve, reject) => {
      this.mysqlConnection.query('SELECT * from Popularity', (err, results) => {
        if (err) reject({error: true, message: err});
        this.myqlResults = results;
        this.closeMysql();
        resolve(this.myqlResults);
      });
    });
  };

};
