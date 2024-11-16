import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Row, Col, Container, Spinner } from "react-bootstrap";
import { useUserContext } from "../../context/UserContext";
import Loading from "../Loading";
import { notifyError } from "../Notification";

const CheckOlympList = ({onClose}) => {
  const [token] = useUserContext();
  const [olymps, setOlymps] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchOlymps = async () => {
    const requestOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    };
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/olymp/check/experts`, requestOptions);
      const data = await response.json();
      if (response.ok) {
        setOlymps(data);
      } else {
        notifyError("Ошибка загрузки олимпиад");
      }
    } catch (error) {
      notifyError("Ошибка запроса получения олимпиад");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOlymps();
  }, []);

  const handleCheck = (id) => {
    navigate(`/check-olymp/${id}`);
    if (onClose) {
      onClose();
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (<>
          {olymps.length > 0 ? (olymps.map((olymp) => (
            <Container key={olymp.id} className="bg-light border rounded border-dark p-2 px-3 mb-2">
              <Row style={{ fontWeight: "bold" }}>{olymp.name}</Row>
              <Row>
                <Col>
                  <Row>Дата начала: {new Date(olymp.start_date + "Z").toLocaleString()}</Row>
                  <Row>Дата конца: {new Date(olymp.end_date + "Z").toLocaleString()}</Row>
                </Col>  
                <Col md="auto" className="p-0 px-1">
                  <Button className="m-0" onClick={() => handleCheck(olymp.id)}>
                    Проверить
                  </Button>
                </Col>
              </Row>
            </Container>
          ))) : (<>Нет олимпиад для проверки</>)}</>
  );
};

export default CheckOlympList;
