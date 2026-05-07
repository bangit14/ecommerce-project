package com.vn.ecommerce_backend.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendVerificationEmail(String to, String fullName, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Xác thực tài khoản E-commerce");

        String emailContent =
                "Xin chào " + fullName + ",\n\n" +
                        "Mã xác thực email của bạn là: " + otp + "\n\n" +
                        "Mã có hiệu lực trong 15 phút. Vui lòng nhập mã này vào ứng dụng/web để hoàn tất đăng ký.\n\n" +
                        "Không chia sẻ mã này với bất kỳ ai.\n\n" +
                        "Trân trọng,\n" +
                        "E-commerce";

        message.setText(emailContent);

        mailSender.send(message);
    }

    @Async
    public void sendPasswordResetEmail(String to, String fullName, String password) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("[E-commerce] Cấp lại mật khẩu tài khoản của bạn");

        String emailContent =
                "Xin chào " + fullName + ",\n\n" +
                        "Chúng tôi đã nhận được yêu cầu cấp lại mật khẩu cho tài khoản của bạn tại E-commerce \n\n" +
                        "Mật khẩu mới của bạn là: " + password + "\n\n" +
                        "Vì lý do bảo mật, bạn vui lòng đăng nhập và thay đổi mật khẩu ngay sau khi truy cập. Nếu bạn không thực hiện yêu cầu này, " +
                        "hãy đổi mật khẩu hiện tại hoặc liên hệ với chúng tôi để đảm bảo an toàn cho tài khoản. ,\n" +
                        "Trân trọng,\n" +
                        "E-commerce";

        message.setText(emailContent);

        mailSender.send(message);
    }
}
