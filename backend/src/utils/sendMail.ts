import dotenv from "dotenv";
import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";

dotenv.config();

interface IMailOptions {
  email: string;
  subject: string;
  template: string;
  dataTosendToEmail: { [key: string]: any };
}

const sendMail = async (options: IMailOptions): Promise<void> => {
  const transporter: nodemailer.Transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const { email, subject, template, dataTosendToEmail } = options;

  const templatePath = path.join(__dirname, "../views", template);

  const html = await ejs.renderFile(templatePath, dataTosendToEmail);

  const mailOptions = {
    from: process.env.SMTP_MAIL,
    to: email,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

export default sendMail;
