import alasql from "alasql";

let prete = false;

export function getDb() {
  if (!prete) {
    alasql("CREATE TABLE IF NOT EXISTS users (id INT, email STRING, password STRING, role STRING)");
    alasql("CREATE TABLE IF NOT EXISTS notes (id INT, userId INT, titre STRING, contenu STRING)");
    alasql("CREATE TABLE IF NOT EXISTS comments (id INT, author STRING, html STRING)");

    alasql("DELETE FROM users");
    alasql("DELETE FROM notes");
    alasql("DELETE FROM comments");

    alasql("INSERT INTO users VALUES (1,'alice@mininotes.test','$2b$10$P39xPjloIytX9WaelgmhcuQcWsbbRFd6uU6mbapu4wK77pPUUIKdW','user')");
    alasql("INSERT INTO users VALUES (2,'bob@mininotes.test','$2b$10$uwxtHCuGmDWNdMYiSAQLMO8dje3oeOwjD5HEpq.JElTnpZxoDjAl.','user')");
    alasql("INSERT INTO users VALUES (3,'admin@mininotes.test','$2b$10$6enKJZrq0A2nmkHzb63usubFU2F9PIFyGnCq6x/Yhg7AfkMIpAwMa','admin')");

    alasql("INSERT INTO notes VALUES (1,1,'Liste de courses','lait, pain, cafe')");
    alasql("INSERT INTO notes VALUES (2,2,'Idee projet','une appli de notes privees')");
    alasql("INSERT INTO notes VALUES (3,3,'Codes admin','le code du coffre est 4271')");

    alasql("INSERT INTO comments VALUES (1,'Alice','Super appli !')");

    prete = true;
  }
  return alasql;
}
