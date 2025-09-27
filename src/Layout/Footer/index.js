import { Container, Row, Col } from 'react-bootstrap';
import { FaFacebookSquare, FaInstagram, FaYoutube,FaEnvelope } from 'react-icons/fa';
import styles from './footer.module.scss';
import { Link } from 'react-router-dom';
import { name } from '~/assets/images';
import images from "~/assets/images";
import routes from '~/config';

function Footer() {
    return (
        <Container className={styles.wrapper} fluid>
            <footer className="bg-secondary text-center text-lg-start text-white ">
                {/* Grid container */}
                <Container className="p-4">
                    {/* Grid row */}
                    <Row className="my-4">
                        {/* Grid column */}
                        <Col lg={3} md={6} className="mb-4 mb-md-0">
                            <div className="rounded-circle bg-white shadow-1-strong d-flex align-items-center justify-content-center mb-4 mx-auto" style={{ width: '150px', height: '150px' }}>
                                <img src={images.logo} height="150px" alt="Logo" loading="lazy" />
                            </div>
                            <ul className="list-unstyled d-flex flex-row justify-content-center">
                                    <a className="text-white px-2" href="#!">
                                        <FaFacebookSquare />
                                    </a>
                                    <a className="text-white px-2" href="#!">
                                        <FaInstagram />
                                    </a>
                                    <a className="text-white ps-2" href="#!">
                                        <FaYoutube />
                                    </a>
                            </ul>
                        </Col>
                        {/* Grid column */}

                        {/* Grid column */}
                        <Col lg={3} md={6} className="mb-4 mb-md-0">
                            <h5 className="mb-4 fw-bold" style={{fontSize:"2rem"}}>{name}</h5>
                            <ul className="list-unstyled">
                                <li className="mb-2">
                                    <Link  to={routes.about} className="text-white">Giới thiệu</Link>
                                </li>
                                
                            </ul>
                        </Col>
                        {/* Grid column */}

                        {/* Grid column */}
                        <Col lg={3} md={6} className="mb-4 mb-md-0">
                        <h5 className="text-uppercase mb-4">Chính Sách và Dịch vụ</h5>
                            <ul className="list-unstyled">
                                <li className="mb-2">
                                    <Link  to={routes.policy} className="text-white">Chính Sách Sử Dụng</Link>
                                </li>
                                <li className="mb-2">
                                    <Link to={routes.service} className="text-white">Dịch Vụ Người Dùng</Link>
                                </li>
                            </ul>
                        </Col>
                        {/* Grid column */}

                        {/* Grid column */}
                        <Col lg={3} md={6} className="mb-4 mb-md-0">
                            <h5 className="text-uppercase mb-4">Contact</h5>
                            <ul className="list-unstyled">
                                <li>
                                    <p><FaEnvelope className="pe-2 mb-0" />winde.contact@gmail.com</p>
                                </li>
                            </ul>
                        </Col>
                        {/* Grid column */}
                    </Row>
                    {/* Grid row */}
                </Container>
                {/* Grid container */}

                {/* Copyright */}
                <div className="text-center p-3" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                    {name} - Nền tảng chia sẻ kiến thức của mọi người
                </div>
                {/* Copyright */}
            </footer>
        </Container>
    );
}

export default Footer;
