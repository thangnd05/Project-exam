import styles from './intro.module.scss';
import { name } from "~/assets/images";
import classNames from "classnames/bind";

const cx =classNames.bind(styles)

function About() {
    return (
        <div className={cx("wrapper","")}>
    <p>Chào các bạn, mình là <strong>{name}</strong>.</p>
    <p>Blog này được tạo ra với mục tiêu trở thành một không gian chia sẻ thân thiện và đầy cảm hứng, nơi mà mỗi cá nhân có thể tìm thấy những kiến thức hữu ích, trao đổi kinh nghiệm và học hỏi từ nhau. Đây là nơi mọi người có thể cùng nhau thảo luận về những chủ đề lập trình, công nghệ, và các kỹ năng phát triển nghề nghiệp trong lĩnh vực này.</p>
    <p>Mình tin rằng việc chia sẻ kiến thức không chỉ giúp ích cho người nhận mà còn làm phong phú thêm hiểu biết của chính người chia sẻ. Mỗi bài viết, mỗi chủ đề mà mình đăng tải là một cơ hội để kết nối cộng đồng, giúp đỡ nhau cùng phát triển. Mình mong muốn blog này sẽ trở thành một điểm đến thường xuyên của bạn, nơi bạn có thể khám phá những thông tin mới mẻ, tìm hiểu về các công nghệ tiên tiến, và nhận được những gợi ý, lời khuyên bổ ích trong quá trình học hỏi và làm việc.</p>
    <p>Tuy nhiên, mình biết rằng blog này vẫn còn nhiều thiếu sót và hạn chế. Do đó, nếu bạn có bất kỳ ý kiến đóng góp, câu hỏi nào hay muốn chia sẻ những kinh nghiệm của chính mình, đừng ngần ngại để lại bình luận bên dưới mỗi bài viết hoặc liên hệ trực tiếp với mình. Mình luôn sẵn sàng lắng nghe và cải thiện blog này để ngày càng hoàn thiện hơn, phục vụ bạn đọc tốt hơn.</p>
    <p>Cảm ơn bạn rất nhiều vì đã ghé thăm blog và dành thời gian đọc phần giới thiệu này. Hy vọng rằng bạn sẽ có những phút giây thú vị, ý nghĩa và bổ ích khi khám phá những bài viết tại đây. Chúc bạn học hỏi được nhiều điều mới mẻ và thành công trong mọi dự án của mình!</p>
        </div>

    );
}

export default About;
