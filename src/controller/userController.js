const db = require("../../config/db");

exports.Login = (req, res) => {
    let body = req.body;
    let values = [body.username];
    let message = {
      errCode: 0,
      errMessage: "Login successfully",
      idUser: null,
    };
    sql = "SELECT id,password FROM user WHERE username = ?";
    db.query(sql, values, function (err, results) {
      if (err) throw err;
      let output = results[0];
      if (output) {
        let check = bcrypt.compareSync(body.password, output.password);
        if (check) {
          message = {
            errCode: 0,
            errMessage: "Login successfully",
            idUser: output.id,
          };
          return res.status(200).json(message);
        } else {
          message = {
            errCode: 1,
            errMessage: "Wrong password",
            idUser: null,
          };
          return res.status(200).json(message);
        }
      } else {
        message = {
          errCode: 1,
          errMessage: "Username does not exist",
          idUser: null,
        };
        return res.status(200).json(message);
      }
    });
  };