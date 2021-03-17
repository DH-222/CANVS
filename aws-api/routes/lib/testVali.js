const { check, checkSchema, validationResult, body } = require('express-validator/check');

const userValidate = (req, res, next) => {
  console.log('req: -- ', req.body);
  // checkSchema({
  //   email:{
  //     isEmail: true,
  //     errorMessage: "hghjhjgjhh",
  //   }
  // });
  check('email').isEmail();
  req.getValidationResult().then((result) => {
    // const errors = validationResult(req);
    // const checksss = req.getValidationResult();
    console.log('Checks: ', result);
    if (result.isEmpty()) {
      console.log('Is empty');
    }
    if (!next) {
      throw new Error(
        result.array().map(i => `'${i.param}' has ${i.msg}`).join(' ')
      );
    }
    // if (!errors.isEmpty()) {
    //   return res.status(422).send({ errors: errors.array() });
    // }
  });
};

module.exports = userValidate;

