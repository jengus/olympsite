import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Row, Col, Container, Spinner } from "react-bootstrap";
import { useUserContext } from "../../context/UserContext";
import Loading from "../Loading";
import { notifyError } from "../Notification";
import CheckOlympList from "../Olymp/CheckOlympList";

const CheckOlympProfile = () => {
  return (
    <>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center" style={{ fontWeight: "bold" }}>
          Проверка Олимпиад
        </Card.Header>
        <Card.Body>
          <CheckOlympList/>
        </Card.Body>
      </Card>
    </>
  );
};

export default CheckOlympProfile;
