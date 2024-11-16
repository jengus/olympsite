import React, {  useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Row,
  Col,
  Container,
  Spinner,
} from "react-bootstrap";
import { useUserContext } from "../../context/UserContext";
import Loading from "../Loading";
import { notifyError, notifySuccess, notifyWarn } from "../Notification";
import EditOlympList from "../Olymp/EditOlympList";


const AdmOlymp = () => {
  const [token, setToken] = useUserContext();
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
    <>
      <Card>
        <Card.Header
          className="d-flex justify-content-between align-items-center"
          style={{ fontWeight: "bold" }}
        >
          Олимпиады
          <Button onClick={handleCreate} disabled={buttonLoading.create}>
            {buttonLoading.create ? <Spinner animation="border" size="sm" /> : "Добавить олимпиаду"}
          </Button>
        </Card.Header>
        <Card.Body>
          <EditOlympList/>
        </Card.Body>
      </Card>
    </>
  );
};

export default AdmOlymp;
