# services/email_service.py
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict, Any
from datetime import datetime

from config import settings, db
from models import Lead

class EmailService:
    """Service for sending emails via SMTP"""
    
    def __init__(self):
        self.smtp_server = settings.smtp_server
        self.smtp_port = settings.smtp_port
        self.sender_email = settings.sender_email
        self.sender_password = settings.email_app_password
        self.logger = logging.getLogger(__name__)
    
    def _validate_email_config(self) -> bool:
        """Validate email configuration"""
        return all([
            self.sender_email,
            self.sender_password,
            self.smtp_server,
            self.smtp_port
        ])
    
    async def send_single_email(self, recipient: str, subject: str, content: str) -> bool:
        """Send a single email to recipient"""
        try:
            if not self._validate_email_config():
                self.logger.error("Email configuration not complete")
                return False
            
            # Create message
            msg = MIMEMultipart()
            msg['From'] = self.sender_email
            msg['To'] = recipient
            msg['Subject'] = subject
            
            # Convert content to HTML if needed
            html_content = content.replace('\n', '<br>')
            msg.attach(MIMEText(html_content, 'html'))
            
            # Send email
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.sender_email, self.sender_password)
            server.send_message(msg)
            server.quit()
            
            self.logger.info(f"Email sent successfully to {recipient}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to send email to {recipient}: {str(e)}")
            return False
    
    async def send_campaign_emails(self, campaign: Dict[str, Any], recipients: List[str], user_id: str) -> Dict[str, Any]:
        """Send campaign emails to multiple recipients and track results"""
        try:
            if not self._validate_email_config():
                raise Exception("Email configuration not set")
            
            campaign_id = campaign['id']
            campaign_title = campaign['title']
            campaign_content = campaign['content']
            
            sent_count = 0
            failed_recipients = []
            
            # Send emails to all recipients
            for recipient in recipients:
                try:
                    # Send email
                    success = await self.send_single_email(
                        recipient=recipient,
                        subject=campaign_title,
                        content=campaign_content
                    )
                    
                    if success:
                        # Create lead entry for successful send
                        lead = Lead(
                            user_id=user_id,
                            campaign_id=campaign_id,
                            email=recipient,
                            interaction_type="sent",
                            status="cold"
                        )
                        await db.leads.insert_one(lead.dict())
                        sent_count += 1
                    else:
                        failed_recipients.append(recipient)
                        
                except Exception as e:
                    self.logger.error(f"Failed to send email to {recipient}: {str(e)}")
                    failed_recipients.append(recipient)
            
            # Update campaign performance
            performance_data = {
                "sent_count": sent_count,
                "failed_count": len(failed_recipients),
                "sent_at": datetime.utcnow().isoformat()
            }
            
            await db.campaigns.update_one(
                {"id": campaign_id},
                {
                    "$set": {
                        "status": "sent",
                        "performance": performance_data
                    }
                }
            )
            
            return {
                "success": True,
                "sent_count": sent_count,
                "failed_count": len(failed_recipients),
                "failed_recipients": failed_recipients,
                "message": f"Campaign sent successfully to {sent_count} recipients"
            }
            
        except Exception as e:
            self.logger.error(f"Campaign email sending failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to send email campaign"
            }
    
    async def send_notification_email(self, recipient: str, subject: str, message: str) -> bool:
        """Send a simple notification email"""
        return await self.send_single_email(recipient, subject, message)
    
    def get_email_status(self) -> Dict[str, Any]:
        """Get email service status"""
        is_configured = self._validate_email_config()
        return {
            "configured": is_configured,
            "smtp_server": self.smtp_server,
            "smtp_port": self.smtp_port,
            "sender_email": self.sender_email if is_configured else "Not configured"
        }