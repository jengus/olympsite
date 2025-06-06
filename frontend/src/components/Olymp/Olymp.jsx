import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Card,
  Modal,
  Tab,
  Nav,
  Row,
  Col,
  CardHeader,
  Form,
  Badge,
  ListGroup,
  Button
} from "react-bootstrap";
import { useUserContext } from "../../context/UserContext";
import AnswerForm from "./AnswerForm";
import Loading from "../Loading";
import { notifyError } from "../Notification";
const Olymp = () => {
  const { id } = useParams();
  const [olymp, setOlymp] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [token] = useUserContext();
  const [olympLoad, setOlympLoad] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const currentTime = new Date().getTime();
  const navigate = useNavigate();


  useEffect(() => {
    fetchOlymp();
  }, [id]);
  const fetchOlymp = async () => {
    if (id) {
      const requestOptions = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      };
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/olymp/member/${id}`,
          requestOptions
        );
        const data = await response.json();
        if (response.ok) {
          setOlymp({
            ...data,
            startDate: new Date(data.start_date + "Z").toLocaleString(),
            endDate: new Date(data.end_date + "Z").toLocaleString(),
            startTime: new Date(data.start_date + "Z").getTime(),
            endTime: new Date(data.end_date + "Z").getTime(),
          });
          if (
            currentTime >= new Date(data.start_date + "Z").getTime()
          ) {
            fetchTasks(data.id);
          }
        } else {
          alert("Ошибка загрузки олимпиады ", data.detail);
          navigate("/");
        }
      } catch (error) {
        console.error("Error fetching olymp", error);
        alert("Ошибка запроса загрузки олимпиады");
        navigate("/");

      } finally {
        setOlympLoad(true);
      }
    }
  };
  const fetchTasks = async () => {
    const requestOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    };
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/olymp/member/${id}/tasks`,
      requestOptions
    );
    const data = await response.json();
    if (response.ok) {
      setTasks(data);
    } else {
      console.error("Failed to fetch olyms", response.statusText);
      notifyError("Ошибка загрузки заданий ", data.detail)
    }
  };
  const handleDownload = async (attachmentId, filename) => {
    const requestOptions = {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
    };
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/olymp/download/olymp/${id}/${attachmentId}`,
        requestOptions
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url); 
      } else {
        console.error("Failed to download attachment", response.statusText);
      }
    } catch (error) {
      console.error("Error downloading attachment", error);
    }
  };
  const handleEnd = () => {
    setShowConfirm(true); // Показать окно подтверждения
  };

  const handleConfirmEnd = () => {
    setShowConfirm(false);
    navigate("/");
  };

  const handleCancelEnd = () => {
    setShowConfirm(false); // Закрыть окно без действий
  };


    if (!olympLoad) {
    return (
      <Loading/>
    );
  }

  return (
    <>
      <Container className="p-0 mt-2">
        <Tab.Container defaultActiveKey="main">
          <Row>
            <Col sm={3} className="col-md-5 col-xl-4">
              <Card>
                <CardHeader>
                  <h5 className="card-title mb-0">Олимпиада</h5>
                </CardHeader>
                <Nav variant="pills" className="list-group list-group-flush">
                  <Nav.Item>
                    <Nav.Link className="menu" eventKey="main">Главная</Nav.Link>
                  </Nav.Item>
                  {tasks.map((task) => (
                    <Nav.Item>
                      <Nav.Link className="menu d-flex justify-content-between align-items-center" eventKey={task.task_number}>
                        {task.task_number}.{task.title} <Form>{task.weight}</Form>
                      </Nav.Link>
                    </Nav.Item>
                  ))}
                  <Nav.Item>
                    <Button onClick={handleEnd} variant="danger"className="w-100">Закончить олимпиаду</Button>
                  </Nav.Item>
                </Nav>
              </Card>
            </Col>
            <Col sm={9} className="col-md-7 col-xl-8">
              <Tab.Content>
                <Tab.Pane eventKey="main">
                  <Card>
                    <Card.Header
                      className="d-flex justify-content-center align-items-center"
                      style={{ fontWeight: "bold" }}
                    >
                      Главная
                    </Card.Header>
                    <Card.Body>
                      <Form>
                        <Form.Group
                          style={{ fontWeight: "bold" }}
                          className="d-flex justify-content-center align-items-center"
                        >
                          {olymp.name}
                        </Form.Group>
                        <Form.Group className="d-flex justify-content-center align-items-center">
                          <div
                            className="view ql-editor"
                            dangerouslySetInnerHTML={{
                              __html: olymp.description,
                            }}
                          />
                        </Form.Group>
                      </Form>
                    </Card.Body>
                  </Card>
                </Tab.Pane>
                {tasks.map((task) => (
                  <Tab.Pane eventKey={task.task_number}>
                    <Card>
                      <Card.Header
                        className="d-flex justify-content-center align-items-center"
                        style={{ fontWeight: "bold" }}
                      >
                        {task.title}
                      </Card.Header>
                      <Card.Body>
                        <div
                          className="view ql-editor"
                          dangerouslySetInnerHTML={{ __html: task.content }}
                        />
                        <Form.Group controlId="formAttachments">
                          {task.attachments.length > 0 ? (
                            <>
                              <Form.Label>Прикрепленные файлы</Form.Label>
                              <ListGroup>
                                {task.attachments.map((attachment) => (
                                  <ListGroup.Item key={attachment.id}>
                                    <span>{attachment.filename}</span>
                                    <Badge
                                      bg="success"
                                      className="ms-3"
                                      onClick={() =>
                                        handleDownload(
                                          attachment.id,
                                          attachment.filename
                                        )
                                      }
                                    >
                                      Скачать
                                    </Badge>
                                  </ListGroup.Item>
                                ))}
                              </ListGroup>
                            </>
                          ) : (
                            <></>
                          )}
                        </Form.Group>
                        <Form.Label>Вес задания: {task.weight}</Form.Label>
                      </Card.Body>
                      <AnswerForm answer={task.user_answer} olymp={olymp} task={task} currentTime={currentTime}/>
                    </Card>
                  </Tab.Pane>
                ))}
                {currentTime < new Date(olymp.start_date + "Z").getTime() && (
                  <Tab.Pane eventKey="main">
                    <Card>
                      <Card.Header
                        className="d-flex justify-content-center align-items-center"
                        style={{ fontWeight: "bold" }}
                      >
                        Ожидайте начала олимпиады
                      </Card.Header>
                    </Card>
                  </Tab.Pane>
                )}
                {currentTime > new Date(olymp.end_date + "Z").getTime() && (
                  <Tab.Pane eventKey="main">
                    <Card>
                      <Card.Header
                        className="d-flex justify-content-center align-items-center"
                        style={{ fontWeight: "bold" }}
                      >
                        Олимпиада закончилась
                      </Card.Header>
                    </Card>
                  </Tab.Pane>
                )}
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      </Container>
      <Modal show={showConfirm} onHide={handleCancelEnd}>
        <Modal.Header closeButton>
          <Modal.Title>Вы уверены?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Вы можете вернуться к олимпиаде в любое время до её окончания.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancelEnd}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleConfirmEnd}>
            Закончить
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Olymp;
