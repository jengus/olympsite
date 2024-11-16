import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import RegisterModal from "./Profile/RegisterModal";
import { useUserContext } from "../context/UserContext";
import { useNavigate } from "react-router";
import ErrorMessage from "./ErrorMessage";
import Loading from "./Loading";

const MainPage = () => {
  const [olymps, setOlymps] = useState([]);
  const [activeModal, setActiveModal] = useState(false);
  const [selectedOlympId, setSelectedOlympId] = useState(null);
  const [token, , user, role] = useUserContext();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const handleModal = (olympId = null) => {
    setActiveModal(!activeModal);
    setSelectedOlympId(olympId);
  };

  const fetchOlymps = async () => {
    const requestOptions = {
      method: "GET",
    };
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/olymp/active`,
        requestOptions
      );
      const data = await response.json();
      if (!response.ok) {
        setErrorMessage("Ошибка получения списка олимпиад");
      } else {
        const formattedOlymps = data.map((olymp) => ({
          ...olymp,
          startDate: new Date(olymp.start_date + "Z").toLocaleString(),
          endDate: new Date(olymp.end_date + "Z").toLocaleString(),
          startTime: new Date(olymp.start_date + "Z").getTime(),
          endTime: new Date(olymp.end_date + "Z").getTime(),
        }));
        setOlymps(formattedOlymps);
      }
    } catch (error) {
      console.error("Error fetching olymps:", error);
      setErrorMessage("Ошибка запроса получения олимпиад");
    } finally {
      setLoading(true);
    }
  };

  useEffect(() => {
    fetchOlymps();
  }, []);

  // Function to calculate time remaining until the start of an olympiad
  const getTimeRemaining = (startTime) => {
    const currentTime = new Date().getTime();
    const difference = startTime - currentTime;

    if (difference <= 0) {
      return "Олимпиада началась";
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return `${days} дн. ${hours} ч. ${minutes} мин. ${seconds} сек.`;
  };

  // Update timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      // Update the state of olymps to force re-rendering
      setOlymps((prevOlymps) => {
        return prevOlymps.map((olymp) => ({
          ...olymp,
          timeRemaining: getTimeRemaining(olymp.startTime),
        }));
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);
  const handleEdit = (id) => {
    navigate(`/edit-olymp/${id}`);
  };
  const handleViewOlymp = (id) => {
    navigate(`/olymp/${id}`);
  };
  return (
    <div>
      <RegisterModal
        olymp_id={selectedOlympId}
        active={activeModal}
        handleModal={handleModal}
      />
      <Container fluid className="py-5">
        <div className="bg-light py-5 mb-5">
          <Container>
            <Row className="justify-content-center">
              <Col md={6} className="text-center">
                <h1>Добро пожаловать на портал</h1>
                <p>
                  Это идеальное место для участия во всех предстоящих и текущих
                  олимпиад. Следите за предстоящими олимпиадами, участвуйте и
                  преуспевайте!
                </p>
              </Col>
            </Row>
          </Container>
        </div>
        <div className="bg-light py-5">
          {loading ? (
            olymps.length > 0 ? (
              <Container>
                <h2 className="text-center mb-4">Олимпиады</h2>
                <Row className="justify-content-center text-center">
                  {olymps.map((olymp) => (
                    <Col key={olymp.id} md={12} className="mb-4">
                      <Card>
                        <Card.Header>
                          <Card.Title>{olymp.name}</Card.Title>
                        </Card.Header>
                        <Card.Body>
                          <div
                            className="view ql-editor"
                            dangerouslySetInnerHTML={{
                              __html: olymp.description,
                            }}
                          />
                          <p className="mt-3">Период проведения:</p>
                          <p>Начало: {olymp.startDate}</p>
                          <p>Конец: {olymp.endDate}</p>
                          {token && user ? (
                            user.role_id >= 2 && user.role_id <= 3 ? (
                              <>
                                <Button onClick={() => handleEdit(olymp.id)}>
                                  Редактировать
                                </Button>
                              </>
                            ) : user.role_id >= 5 && user.role_id <= 6 ? (
                              new Date().getTime() < olymp.startTime ? (
                                <>
                                  <p>До начала: {olymp.timeRemaining}</p>
                                </>
                              ) : (
                                <>
                                  <Button
                                    onClick={() => handleViewOlymp(olymp.id)}
                                  >
                                    Перейти к олимпиаде
                                  </Button>
                                </>
                              )
                            ) : (
                              <></>
                            )
                          ) : new Date().getTime() < olymp.startTime ? (
                            <>
                              <p>До начала: {olymp.timeRemaining}</p>
                              <Button
                                variant="primary"
                                onClick={() => handleModal(olymp.id)}
                              >
                                Принять участие
                              </Button>
                            </>
                          ) : (
                            <></>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Container>
            ) : (
              <>
                <h2 className="text-center mb-4">Олимпиады</h2>
                {errorMessage ? (
                  <div className="d-flex justify-content-center">
                    <ErrorMessage message={errorMessage} />
                  </div>
                ) : (
                  <Container className="d-flex justify-content-center">
                    <h4>В настоящее время олимпиады не проводятся</h4>
                  </Container>
                )}
              </>
            )
          ) : (
            <Loading />
          )}
        </div>
      </Container>
    </div>
  );
};

export default MainPage;
