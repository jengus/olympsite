import React, { useState } from "react";
import {
  Container,
  Navbar,
  Nav,
} from "react-bootstrap";
import logo from "../logo.png";
import account from "./account.png";
import LoginModal from "./Profile/LoginModal"
import { useUserContext } from "../context/UserContext";
import { Link } from "react-router-dom";
import CheckOlympList from "./Olymp/CheckOlympList";
import CheckOlympModal from "./Olymp/CheckOlympModal";
import EditOlympModal from "./Olymp/EditOlympModal";

const Header = () => {
  const [activeModal, setActiveModal] = useState(false);
  const [activeCheckModal, setActiveCheckModal] = useState(false);
  const [activeEditOlympModal, setActiveEditOlympModal] = useState(false);
  const [ token, , user ] = useUserContext();

  const handleModal = () => {
    setActiveModal(!activeModal);
  };
  const handleCheckModal = () => {
    setActiveCheckModal(!activeCheckModal);
  };
  const handleEditOlympModal = () => {
    setActiveEditOlympModal(!activeEditOlympModal);
  };
  return (
    <>
      <LoginModal active={activeModal} handleModal={handleModal} />
      <CheckOlympModal active={activeCheckModal} handleModal={handleCheckModal}/>
      <EditOlympModal active = {activeEditOlympModal} handleModal={handleEditOlympModal}/>
      <Navbar 
        sticky="top"
        collapseOnSelect
        expand="md"
        className="custom-navbar"
        // bg="dark"
        // variant="dark"
      >
        <Container>
          <Navbar.Brand as={Link} to="/">
            <img
              src={logo}
              height="30"
              width="30"
              className="d-inline-block align-top"
              alt="Logo"
            />
            OlympMaster
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-nav">
            <Nav>
              <Nav.Link as={Link} to="/">Главная</Nav.Link>
            </Nav>
            {token && user ? (user.role_id === 2 || user.role_id === 3 ? (
              <Nav>
              <Nav.Link onClick={handleEditOlympModal} style={{ whiteSpace: "nowrap" }}>Управление олимпиадами</Nav.Link>
              </Nav>
              ): (<></>)):(<></>)}    
            {token && user ? (user.role_id === 3 || user.role_id === 4 ?(
              <Nav>
              <Nav.Link onClick={handleCheckModal} style={{ whiteSpace: "nowrap" }}>Проверка олимпиад</Nav.Link>
              </Nav>): (<></>)):(<></>)}           
            
            {token && user ? (
              <Navbar.Brand as={Link} to="/account" className="ms-auto">
                {user.name}
                <img
                  src={account}
                  height="30"
                  width="30"
                  className="d-inline-block align-top"
                  alt="Account"
                />
              </Navbar.Brand>
            ) : (
              <Navbar.Brand onClick={handleModal} className="ms-auto">
                <img
                  src={account}
                  height="30"
                  width="30"
                  className="d-inline-block align-top"
                  alt="Account"
                />
              </Navbar.Brand>
            )}
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
};

export default Header;