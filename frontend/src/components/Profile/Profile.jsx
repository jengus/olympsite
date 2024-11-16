import React, {
  useState, useContext
} from "react";
import UserInfo from "./UserInfo";
import PassChange from "./PassChange";
import {
  Container,
  Tab,
  Nav,
  Row,
  Col,
  Button,
  Card,
  CardHeader,
} from "react-bootstrap";
import AdmOlymp from "./AdmOlymp";
import {UserContext, useUserContext } from "../../context/UserContext";
import UsersTable from "./UsersTable";
import CheckOlympProfile from "./CheckOlympProfile";
import { notifyError } from "../Notification";

const Profile = () => {
  const [token, ,user] = useContext(UserContext);
  const [,setToken] = useUserContext();
  const [activeTab, setActiveTab] = useState("first");
  // const handleLogout = async () => {
  //   const requestOptions = {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: "Bearer " + token,
  //     },
  //   };
  //   const response = await fetch(
  //     `${process.env.REACT_APP_API_URL}/auth/jwt/logout`,
  //     requestOptions
  //   );
  //   try {
  //     const data = await response.json();
  //     if (response.ok) {
  //       setToken(null);
  //     } else {
  //       notifyError("Ошибка выхода с аккаунта");
  //     }
  //   } catch (error) {
  //     notifyError("Ошибка выхода с аккаунта");
  //   }
  // };
  const handleLogout = () => {
    setToken(null);
  }

  const handleSelect = (eventKey) => {
    setActiveTab(eventKey);
  };
  return (
    <>
      <Container className="p-0 mt-2">
        <Tab.Container defaultActiveKey="account" onSelect={handleSelect}>
          <Row>
            <Col sm={3} className="col-md-5 col-xl-4">
              <Card>
                <CardHeader>
                  <h5 className="card-title mb-0">Профиль</h5>
                </CardHeader>
                <Nav variant="pills" className="list-group list-group-flush nav">
                  <Nav.Item>
                    <Nav.Link eventKey="account" className="menu">Аккаунт</Nav.Link>
                  </Nav.Item>     
                  {user ? ((user.role_id===2) || (user.role_id ===3) ? (<>
                    <Nav.Item>
                    <Nav.Link eventKey="users" className="menu">Список пользователей</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                  <Nav.Link eventKey="olymplist" className="menu">Список олимпиад</Nav.Link>
                </Nav.Item></>
                  ):(<></>)) : (<></>)}   
                     {user ? ((user.role_id===3) || (user.role_id ===4) ? (<>
                <Nav.Item>
                    <Nav.Link eventKey="checkolymp" className="menu">Проверка олимпиад</Nav.Link>
                  </Nav.Item></>
                  ):(<></>)) : (<></>)}   
                  <Nav.Item>
                    <Nav.Link eventKey="password" className="menu">Пароль</Nav.Link>
                  </Nav.Item>
                  <Button variant="danger" type="logout" onClick={handleLogout}>
                    Выход
                  </Button>
                </Nav>
              </Card>
            </Col>
            <Col sm={9} className="col-md-7 col-xl-8">
              <Tab.Content>
                <Tab.Pane eventKey="account">
                  <UserInfo />
                </Tab.Pane>
                <Tab.Pane eventKey="password">
                  <PassChange />
                </Tab.Pane>
                {user ? ((user.role_id===2) || (user.role_id ===3) ? (<>
                    <Tab.Pane eventKey="users">
                    {activeTab === "users" && <UsersTable />}
                    </Tab.Pane>
                    <Tab.Pane eventKey="olymplist">
                    {activeTab === "olymplist" && (<AdmOlymp />)}
                    </Tab.Pane></>
                  ):(<></>)) : (<></>)}    
                  {user ? ((user.role_id===3) || (user.role_id ===4) ? (<>
                    <Tab.Pane eventKey="checkolymp">
                    {activeTab === "checkolymp" && (<CheckOlympProfile/>)}
                    </Tab.Pane></>
                  ):(<></>)) : (<></>)} 
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      </Container>
    </>
  );
};

export default Profile;
