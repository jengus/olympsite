import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Table from "react-bootstrap/Table";
import { Button, Spinner } from "react-bootstrap";
import { useUserContext } from "../../context/UserContext";
import CheckOlympProfile from "../Profile/CheckOlympProfile";
import CheckOlympList from "./CheckOlympList";

const CheckOlympModal = ({active, handleModal}) => {


  return (
    <Modal size="lg" show={active} onHide={handleModal}>
      <Modal.Header closeButton>
        Проверка олимпиад
      </Modal.Header>
      <Modal.Body>
        <CheckOlympList onClose={handleModal}/>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleModal}>Закрыть</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CheckOlympModal;
