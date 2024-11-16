import React from "react";
import { useLocation} from "react-router-dom";
import {
  Container,
  Tab,
  Nav,
  Row,
  Col,
  Card,
  CardHeader,
  Form,
  Badge,
  ListGroup,
} from "react-bootstrap";

const OlympPreview = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const name = queryParams.get("name");
  const description = queryParams.get("description");
  const tasks = JSON.parse(queryParams.get("tasks"));

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
                        <Nav.Link className="menu" eventKey="main">
                          Главная
                        </Nav.Link>
                    </Nav.Item>
                    {tasks.map((task) => (
                      <Nav.Item>
                        <Nav.Link className="menu" eventKey={task.task_number}>
                          {task.task_number}.{task.title}
                        </Nav.Link>
                      </Nav.Item>
                    ))}
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
                        >Главная
                        </Card.Header>
                        <Card.Body>
                            <Form>
                                <Form.Group style={{ fontWeight: "bold" }} className="d-flex justify-content-center align-items-center">
                                    {name}
                                </Form.Group>
                                <Form.Group className="d-flex justify-content-center align-items-center">
                                <div
              className="view ql-editor"
              dangerouslySetInnerHTML={{ __html: description }}
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
                                        pill
                                        bg="success"
                                        className="ms-3"
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
                        </Card.Body>
                      </Card>
                    </Tab.Pane>
                  ))}
                </Tab.Content>
              </Col>
            </Row>
          </Tab.Container>
        </Container>
      </>
  );
};
export default OlympPreview;
