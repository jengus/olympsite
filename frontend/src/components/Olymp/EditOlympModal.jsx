import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Table from "react-bootstrap/Table";
import { Button, Spinner } from "react-bootstrap";
import { useUserContext } from "../../context/UserContext";
import CheckOlympProfile from "../Profile/CheckOlympProfile";
import CheckOlympList from "./CheckOlympList";
import EditOlympList from "./EditOlympList";
import { useNavigate } from "react-router-dom";
import { notifyError } from "../Notification";

const EditOlympModal = ({active, handleModal}) => {
  const [token] = useUserContext();
  const [buttonLoading, setButtonLoading] = useState({});
  const navigate = useNavigate();
  const date = new Date();
  const handleCreate = async () => {
    setButtonLoading((prev) => ({ ...prev, create: true }));
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        name: "Без названия",
        description: "",
        start_date: date.toISOString(),
        end_date: date.toISOString(),
      }),
    };
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/olymp/create`,
        requestOptions
      );
      const data = await response.json();
      if (response.ok) {
        navigate(`/edit-olymp/${data.id}`);
        handleModal();
      } else {
        console.error("Failed to create olymp ", data.detail);
        notifyError("Ошибка создания олимпиады ", data.detail);
      }
    } catch (error) {
      console.error("Failed to create olymp", error);
      notifyError("Ошибка запроса");
    } finally {
      setButtonLoading((prev) => ({ ...prev, create: false }));
    }
  };

  return (
    <Modal size="lg" show={active} onHide={handleModal}>
      <Modal.Header closeButton 
        >
          Олимпиады
      </Modal.Header>
      <Modal.Body>
        <EditOlympList onClose={handleModal}/>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between align-items-center">
      <Button onClick={handleCreate} disabled={buttonLoading.create}>
            {buttonLoading.create ? <Spinner animation="border" size="sm" /> : "Добавить олимпиаду"}
          </Button>
        <Button onClick={handleModal} variant="secondary">Закрыть</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditOlympModal;
