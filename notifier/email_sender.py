import smtplib
import ssl
from email.message import EmailMessage
from typing import List, Optional, Union
import logging
import mimetypes
from pathlib import Path


class EmailSender:
    def __init__(
        self,
        sender_email: str,
        server: str = "localhost",
        port: int = 25,
        password: Optional[str] = None,
        use_tls: bool = False,
        use_ssl: bool = False,
        logger: Optional[logging.Logger] = None
    ):
        if use_tls and use_ssl:
            raise ValueError("Cannot use both TLS and SSL at the same time.")

        self.sender_email = sender_email
        self.server = server
        self.port = port
        self.password = password
        self.use_tls = use_tls
        self.use_ssl = use_ssl
        
        if (logger is None):
            self.logger = logging.getLogger(__name__)
            self.logger.info("Started email logger")
        else:
            self.logger = logger
            self.logger.info("Started using external logger on email sender")

    def _create_message(
        self,
        recipient_email: Union[str, List[str]],
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        attachments: Optional[List[Union[str, Path]]] = None,
    ) -> EmailMessage:
        """Create an EmailMessage object with optional HTML and attachments."""
        if isinstance(recipient_email, str):
            recipient_email = [recipient_email]

        self.logger.debug(f"Creating email message on {self.server}:{self.port}")
        msg = EmailMessage()
        self.logger.debug(f"Email message created")
        msg.set_content(body)

        if html_body:
            msg.add_alternative(html_body, subtype="html")

        msg["Subject"] = subject
        msg["From"] = self.sender_email
        msg["To"] = ", ".join(recipient_email)

        if attachments:
            for file_path in attachments:
                path = Path(file_path)
                if not path.is_file():
                    self.logger.warning(f"Attachment not found: {file_path}")
                    continue
                ctype, encoding = mimetypes.guess_type(str(path))
                if ctype is None or encoding is not None:
                    ctype = "application/octet-stream"
                maintype, subtype = ctype.split("/", 1)
                with open(path, "rb") as f:
                    msg.add_attachment(f.read(),
                                       maintype=maintype,
                                       subtype=subtype,
                                       filename=path.name)
        return msg

    def _connect(self):
        """Return an SMTP connection (SSL or plain) with optional STARTTLS."""
        context = ssl.create_default_context()
        if self.use_ssl:
            server = smtplib.SMTP_SSL(self.server, self.port, context=context)
        else:
            server = smtplib.SMTP(self.server, self.port)
            server.ehlo()
            if self.use_tls:
                server.starttls(context=context)
                server.ehlo()
        if self.password:
            server.login(self.sender_email, self.password)
        return server

    def send(
        self,
        recipient_email: Union[str, List[str]],
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        attachments: Optional[List[Union[str, Path]]] = None,
    ):
        """Send a single email with optional HTML and attachments."""
        msg = self._create_message(recipient_email, subject, body, html_body, attachments)
        try:
            with self._connect() as server:
                self.logger.debug(f"Connected to server {self.server}:{self.port}")
                server.send_message(msg, from_addr=self.sender_email,
                                    to_addrs=[recipient_email] if isinstance(recipient_email, str) else recipient_email)
            self.logger.info(f"Email sent successfully to {recipient_email}")
        except (smtplib.SMTPException, OSError) as e:
            self.logger.error(f"Error sending email to {recipient_email}: {e}")   
            raise

if __name__ == "__main__":
    pass
