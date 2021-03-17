const nodemailer = require('nodemailer');
const Promise = require('bluebird');
// const multer = require('multer');

// const upload = multer({ dest: 'uploads/' });

const emailCred = {
  service: 'Gmail',
  auth: {
    user: 'canvsdigital@gmail.com',
    pass: 'Streetart2019!',
  },
  // logger: true,
  // debug: true,
};

const ec2Cred = {
  service: 'Gmail',
  host: 'smtp.gmail.com',
  port: '465',
  secure: 'true',
  auth: {
    user: 'canvsdigital@gmail.com',
    pass: 'Streetart2019!',
  },
};

const htmlBody = (body) => {
  let htmlText = `<div> Email sent from ${body.reporter}<br>`;
  htmlText += `<em style='font-weight:bold;'>Message:</em><br> ${body.message}<br>`;
  htmlText += `<em style='font-weight:bold;'>Addtional Message: </em><br>${body.optMessage}<br>`;
  htmlText += `<em style='font-weight:bold;'>Device data:</em> <br> Device: ${body.device}`;
  htmlText += `<br> os: ${body.os} <br> version: ${body.version}<br> appId: ${body.appId}<br><br>`;
  htmlText += `Message created at ${new Date().toLocaleString('en-US', { hour12: true })}</div>`;
  return htmlText;
};

exports.emailer = (req, res, next) => {
  const emailMessage = {
    to: 'canvsdigital@gmail.com',
    from: 'canvsdigital.alerts@gmail.com',
    subject: req.body.subject,
    html: htmlBody(req.body)
  };
  console.log('What is happening here', emailMessage);
  const transporter = nodemailer.createTransport(ec2Cred);
  transporter.sendMail(emailMessage, (err, info) => {
    if (err) {
      // next({ error: true, message: 'Could send email to email address provided', err });
      res.status(403).send({ error: true, message: 'Could not send email' });
    } else {
      res.send({ data: 'Email has been sent' });
    }
  });

  // const transporter = Promise.promisifyAll(nodemailer.createTransport(emailCred));
  // transporter.sendMailAsync(emailMessage)
  //   .then(() => {
  //     res.send({ body: 'Email has been sent' });
  //   }).catch(() => {
  //     res.send({ error: true, message: 'There was an error in sending your email, please try again' });
  //   });
};
