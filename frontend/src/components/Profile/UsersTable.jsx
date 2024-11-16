import React, { useEffect, useState } from "react";
import { Table, Button, Card, CardHeader, Form, Spinner, Container } from "react-bootstrap";
import ErrorMessage from "../ErrorMessage";
import UserModal from "./UserModal";
import { useUserContext } from "../../context/UserContext";
import Loading from "../Loading";
import { notifyError, notifySuccess, notifyWarn } from "../Notification";

const UsersTable = () => {
  const [token, , user] = useUserContext();
  const [users, setUsers] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [activeModal, setActiveModal] = useState(false);
  const [moduser, setModuser] = useState(null);
  const [roleFilter, setRoleFilter] = useState("all");
  const [deletingUserIds, setDeletingUserIds] = useState([]);


  const roles = [
    { id: 1, name: "Пользователь" },
    { id: 2, name: "Администратор" },
    { id: 3, name: "Организатор" },
    { id: 4, name: "Эксперт" },
    { id: 5, name: "Участник" },
    { id: 6, name: "Команда" },
  ];

  const userRole = user.role_id;

  const handleUpdate = async (user) => {
    setModuser(user);
    setActiveModal(true);
  };

  const handleDelete = async (id) => {
    setDeletingUserIds((prev) => [...prev, id]);
    const requestOptions = {
      method: "DELETE",
      headers: {
        "Content-type": "application/json",
        Authorization: "Bearer " + token,
      },
    };
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/customusers/${id}`, requestOptions);
      if (!response.ok) {
        const data = await response.json();
        notifyError("Ошибка удаления ", data.detail);
      } else {
        notifySuccess("Успешное удаление пользователя")
        getUsers();
      }
    } catch (error) {
      notifyError("Ошибка запроса на удаление");
    } finally {
      setDeletingUserIds((prev) => prev.filter((userId) => userId !== id));
    }
  };

  const getUsers = async () => {
    setLoaded(false);
    const requestOptions = {
      method: "GET",
      headers: {
        "Content-type": "application/json",
        Authorization: "Bearer " + token,
      },
    };
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/customusers/all`, requestOptions);
      const data = await response.json();
      if (!response.ok) {
        notifyError("Ошибка получения пользователей ", data.detail);
      } else {
        setUsers(data);
        setLoaded(true);
      }
    } catch (error) {
      notifyError("Ошибка запроса получения пользователей", error);
    }
  };

  useEffect(() => {
    getUsers();
  }, []);

  const handleModal = () => {
    setActiveModal(!activeModal);
    setModuser(null);
  };

  const handleModalWithChanges = () => {
    setActiveModal(!activeModal);
    getUsers();
    setModuser(null);
  };
  
  const filteredUsers = users?.filter(user => {
    if (roleFilter === "all") return true;
    const role = roles.find(role => role.id === user.role_id);
    return role.name === roleFilter;
  });

  const isRoleAllowed = (role) => {
    if (userRole === 2 && role.id === 2) return false;
    if (userRole === 3 && (role.id === 2 || role.id === 3)) return false;
    return true;
  };

  return (
    <>
      <Card style={{ height: 'calc(100vh - 100px)', overflow: 'hidden' }}>
        <CardHeader>
          <Container className="d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">Пользователи</h5>
          <Button variant="primary" className="mt-3" onClick={() => setActiveModal(true)}>
            Создать пользователя
          </Button>
          </Container>
          <Form.Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="mt-2"
          >
            <option value="all">Все пользователи</option>
            {roles.map((role) => (
              isRoleAllowed(role) && (
                <option key={role.id} value={role.name}>
                  {role.name}
                </option>
              )
            ))}
          </Form.Select>
        </CardHeader>
        <ErrorMessage message={errorMessage} />
        {loaded && users ? (
          <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 200px)" }}>
            <Table>
              <thead className="table-header">
                <tr>
                  <th className="text-center">{roleFilter === "Команда" ? "Название" : "Имя"}</th>
                  {roleFilter !== "Команда" && <th className="text-center">Фамилия</th>}
                  {roleFilter !== "Команда" && <th className="text-center">Отчество</th>}
                  <th className="text-center">email</th>
                  <th className="text-center">Роль</th>
                  <th className="text-center">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    {roleFilter !== "Команда" && <td>{user.lastname}</td>}
                    {roleFilter !== "Команда" && <td>{user.surname}</td>}
                    <td>{user.email}</td>
                    <td>{user.role_name}</td>
                    <td className="text-center">
                      <Button className="me-2 ms-2 save" onClick={() => handleUpdate(user)}>
                        Изменить
                      </Button>
                      <Button variant="danger"
                        className="delete"
                        onClick={() => handleDelete(user.id)}
                        disabled={deletingUserIds.includes(user.id)}
                      >
                        {deletingUserIds.includes(user.id) ? <Spinner animation="border" size="sm" /> : "Удалить"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ) : (
          <Loading />
        )}
        <UserModal
          active={activeModal}
          handleModal={handleModal}
          handleModalWithChanges={handleModalWithChanges}
          token={token}
          user={moduser}
          setErrorMessage={setErrorMessage}
          roles={roles}
          userRole={user.role_id}
        />
      </Card>
    </>
  );
};

export default UsersTable;
