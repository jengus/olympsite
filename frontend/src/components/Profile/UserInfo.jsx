import React from "react";
import { Row, Card, Form, Col } from "react-bootstrap";
import { useUserContext } from "../../context/UserContext";
import Loading from "../Loading";

const UserInfo = () => {
  const [token, , user] = useUserContext();

  if (user.role_id === 6) {
    return (
      token &&
      user && (
        <Card>
          <Card.Header style={{ fontWeight: "bold" }}>Аккаунт</Card.Header>
          <Card.Body>
            <Col sm={12}>
              <Form>
                <Form.Group className="mt-2">
                  <Form.Label>Название команды</Form.Label>
                  <Form.Control type="firstname" value={user.name} />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Члены команды</Form.Label>
                  {user.members.map((member, index) => (
                    <div key={index} className="mb-2">
                      
                      <Form.Label>{`Участник ${index + 1}`}</Form.Label>
                      <Row>
                      <Col><Form.Control value={member.lastname} className="mb-1" /></Col>
                      <Col><Form.Control value={member.name} className="mb-1" /></Col>
                      <Col><Form.Control value={member.surname} /></Col>
                      </Row>
                    </div>
                  ))}
                </Form.Group>
                <Form.Group className="mt-2">
                  <Form.Label>Роль</Form.Label>
                  <Form.Control type="role" value={user.role_name} />
                </Form.Group>
                <Form.Group className="mt-2">
                  <Form.Label>Организация</Form.Label>
                  <Form.Control type="organisation" value={user.organisation} />
                </Form.Group>
                <Form.Group className="mt-2">
                  <Form.Label>Руководитель</Form.Label>
                  <Form.Control type="teacher" value={user.teacher} />
                </Form.Group>
              </Form>
            </Col>
          </Card.Body>
        </Card>
      )
    );
  }
  return token && user ? (
    <>
      {
        <Card>
          <Card.Header style={{ fontWeight: "bold" }}>Аккаунт</Card.Header>
          <Card.Body>
            <Col sm={5}>
              <Form>
                <Form.Group>
                  <Form.Label>Фамилия</Form.Label>
                  <Form.Control type="lastname" value={user.lastname} />
                </Form.Group>
                <Form.Group className="mt-2">
                  <Form.Label>Имя</Form.Label>
                  <Form.Control type="firstname" value={user.name} />
                </Form.Group>
                <Form.Group className="mt-2">
                  <Form.Label>Отчество</Form.Label>
                  <Form.Control type="surname" value={user.surname} />
                </Form.Group>
                <Form.Group className="mt-2">
                  <Form.Label>Почта</Form.Label>
                  <Form.Control type="email" value={user.email} />
                </Form.Group>
                <Form.Group className="mt-2">
                  <Form.Label>Роль</Form.Label>
                  <Form.Control type="role" value={user.role_name} />
                </Form.Group>
                <Form.Group className="mt-2">
                  <Form.Label>Организация</Form.Label>
                  <Form.Control type="organisation" value={user.organisation} />
                </Form.Group>
                {user.role_id===5? (<Form.Group className="mt-2">
                  <Form.Label>Руководитель</Form.Label>
                  <Form.Control type="teacher" value={user.teacher} />
                </Form.Group>):(<></>)}
              </Form>
            </Col>
          </Card.Body>
        </Card>
      }
    </>
  ) : (
    <Loading/>
  );
};

export default UserInfo;
