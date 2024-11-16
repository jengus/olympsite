import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import { Row, Col, Button, InputGroup, Spinner } from "react-bootstrap";
import { notifyError, notifySuccess } from "../Notification";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const UserModal = ({
  active,
  handleModal,
  handleModalWithChanges,
  token,
  user,
  roles,
  userRole,
}) => {
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [role_id, setRole_id] = useState(1);
  const [password, setPassword] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [members, setMembers] = useState([]);
  const [roleName, setRoleName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isNotPassword, setIsNotPassword] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [teacher, setTeacher] = useState("");
  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpaces = /\s/.test(password);
    if (user && isNotPassword) {
      return "";
    } else if (password.length < minLength) {
      return "Пароль должен содержать минимум 8 символов";
    } else if (!hasUpperCase) {
      return "Пароль должен содержать минимум одну заглавную букву";
    } else if (!hasLowerCase) {
      return "Пароль должен содержать минимум одну строчную букву";
    } else if (!hasNumbers) {
      return "Пароль должен содержать минимум одну цифру";
    } else if (hasSpaces) {
      return "Пароль не должен содержать пробелы";
    } else {
      return "";
    }
  };

  const validateEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email) ? "" : "Введите корректный email";
  };

  const validateNameField = (value) => {
    const regex = /^[а-яА-ЯёЁ\-]+$/;
    if (!value) return "Поле обязательно";
    if (/\s/.test(value)) return "Поле не должно содержать пробелы";
    if (!regex.test(value))
      return `Поле может содержать только русские буквы и тире`;
    if (value[0] !== value[0].toUpperCase())
      return `Поле должно начинаться c заглавной буквы`;
    return "";
  };
  const validateTeacher = (teacher) => {
    const teacherPattern = /^[А-ЯЁ][а-яё]+(-[А-ЯЁ][а-яё]+)?\s[А-ЯЁ][а-яё]+\s[А-ЯЁ][а-яё]+$/;
    return teacherPattern.test(teacher) ? "": "Введите корректно";
  }
  const validateFields = () => {
    const errors = {};

    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;

    const passwordError = validatePassword(password);
    if (passwordError) errors.password = passwordError;
    if (role_id !== 6) {
      if (!name) {
        errors.name = "Имя обязательно";
      } else {
        const nameError = validateNameField(name);
        if (nameError) errors.name = nameError;
      }

      if (!lastname) {
        errors.lastname = "Фамилия обязательна";
      } else {
        const lastnameError = validateNameField(lastname);
        if (lastnameError) errors.lastname = lastnameError;
      }

      if (!surname) {
        errors.surname = "Отчество обязательно";
      } else {
        const surnameError = validateNameField(surname);
        if (surnameError) errors.surname = surnameError;
      }
    }
    if (role_id === 5 || role_id===6) {
      const teacherError = validateTeacher(teacher);
      if (teacherError) errors.teacher = teacherError;
    }
    if (!organisation) errors.organisation = "Организация обязательна";
    if (role_id === 6 && !teamName)
      errors.teamName = "Название команды обязательно";
    if (role_id === 6) {
      members.forEach((member, index) => {
        if (!member.name) {
          errors[`memberName${index}`] = "Имя члена команды обязательно";
        } else {
          const memberNameError = validateNameField(member.name);
          if (memberNameError) errors[`memberName${index}`] = memberNameError;
        }

        if (!member.lastname) {
          errors[`memberLastname${index}`] =
            "Фамилия члена команды обязательна";
        } else {
          const memberLastnameError = validateNameField(member.lastname);
          if (memberLastnameError)
            errors[`memberLastname${index}`] = memberLastnameError;
        }

        if (!member.surname) {
          errors[`memberSurname${index}`] =
            "Отчество члена команды обязательно";
        } else {
          const memberSurnameError = validateNameField(member.surname);
          if (memberSurnameError)
            errors[`memberSurname${index}`] = memberSurnameError;
        }
      });
    }
    return errors;
  };

  useEffect(() => {
    setFieldErrors({});
    setLoading(false);
    if (user) {
      setName(user.name || "");
      setLastname(user.lastname || "");
      setSurname(user.surname || "");
      setEmail(user.email || "");
      setRole_id(user.role_id || 1);
      setOrganisation(user.organisation || "");
      setMembers(user.members || []);
      setRoleName(user.role_name || "Пользователь");
      setTeamName(user.name || "");
      setIsNotPassword(true);
      setTeacher(user.teacher || "");
    } else {
      cleanFormData();
      setIsNotPassword(false);
    }
  }, [user]);

  const cleanFormData = () => {
    setName("");
    setLastname("");
    setSurname("");
    setEmail("");
    setRole_id(1);
    setPassword("");
    setOrganisation("");
    setMembers([]);
    setRoleName("");
    setTeamName("");
    setLoading(false);
    setTeacher("");
  };

  const handleCreateUser = async (e) => {
    const errors = validateFields();
    if (Object.keys(errors).length > 0) {
      notifyError("Ошибки заполнения.");
      setFieldErrors(errors);
      return;
    }
    setLoading(true);
    e.preventDefault();
    const userData = {
      email: email.toLowerCase(),
      password: password || null,
      name: name,
      lastname: lastname,
      surname: surname,
      role_id: role_id,
      organisation: organisation,
    };
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(userData),
    };

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/customusers/create_user`,
        requestOptions
      );
      const data = await response.json();
      if (!response.ok) {
        notifyError("Ошибка создания пользователя ", data.detail);
      } else {
        notifySuccess("Успешное создание пользователя.");
        cleanFormData();
        handleModalWithChanges();
      }
    } catch (error) {
      notifyError("Ошибка запроса создания пользователя.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    const errors = validateFields();
    if (Object.keys(errors).length > 0) {
      notifyError("Ошибки заполнения.");
      setFieldErrors(errors);
      return;
    }
    setLoading(true);
    const userData = {
      id: user.id,
      name: name,
      lastname: lastname,
      surname: surname,
      role_id: role_id,
      organisation: organisation,
    };

    if (!isNotPassword) {
      userData.password = password;
    }

    if (role_id === 6) {
      userData.members = members;
    }
    if (role_id === 6 || role_id === 5) {
      userData.teacher = teacher;
    }
    const requestOptions = {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(userData),
    };

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/customusers/${user.id}`,
        requestOptions
      );
      const data = await response.json();
      if (!response.ok) {
        notifyError("Ошибка обновления пользователя ", data.detail);
      } else {
        notifySuccess("Успешное обновление пользователя.");
        cleanFormData();
        handleModalWithChanges();
      }
    } catch (error) {
      notifyError("Ошибка запроса обновления пользователя.");
    }
  };

  const isRoleAllowed = (role) => {
    if (userRole === 2 && (role.id === 2 || role.id === 5 || role.id === 6))
      return false;
    if (
      userRole === 3 &&
      (role.id === 2 || role.id === 3 || role.id === 5 || role.id === 6)
    )
      return false;
    return true;
  };

  const handleMemberChange = (index, field, value) => {
    const updatedMembers = [...members];
    updatedMembers[index][field] = value;
    setMembers(updatedMembers);
  };

  return (
    <Modal show={active} onHide={handleModal}>
      <Modal.Header closeButton>
        <Modal.Title>
          {user ? "Изменить пользователя" : "Создать пользователя"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {role_id === 6 && (
            <>
              <Form.Group>
                <Form.Label>Название команды</Form.Label>
                <Form.Control
                  placeholder="Введите название команды"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  isInvalid={!!fieldErrors.teamName}
                />
                <Form.Control.Feedback type="invalid">
                  {fieldErrors.teamName}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group>
                <Form.Label>Члены команды</Form.Label>
                {members.map((member, index) => (
                  <div key={index} className="mb-2">
                    <Row>
                      <Col>
                        <Form.Control
                          type="text"
                          placeholder="Фамилия"
                          value={member.lastname}
                          onChange={(e) =>
                            handleMemberChange(
                              index,
                              "lastname",
                              e.target.value
                            )
                          }
                          isInvalid={!!fieldErrors[`memberLastname${index}`]}
                        />
                        <Form.Control.Feedback type="invalid">
                          {fieldErrors[`memberLastname${index}`]}
                        </Form.Control.Feedback>
                      </Col>
                      <Col>
                        <Form.Control
                          type="text"
                          placeholder="Имя"
                          value={member.name}
                          onChange={(e) =>
                            handleMemberChange(index, "name", e.target.value)
                          }
                          isInvalid={!!fieldErrors[`memberName${index}`]}
                        />
                        <Form.Control.Feedback type="invalid">
                          {fieldErrors[`memberName${index}`]}
                        </Form.Control.Feedback>
                      </Col>
                      <Col>
                        <Form.Control
                          type="text"
                          placeholder="Отчество"
                          value={member.surname}
                          onChange={(e) =>
                            handleMemberChange(index, "surname", e.target.value)
                          }
                          isInvalid={!!fieldErrors[`memberSurname${index}`]}
                        />
                        <Form.Control.Feedback type="invalid">
                          {fieldErrors[`memberSurname${index}`]}
                        </Form.Control.Feedback>
                      </Col>
                    </Row>
                  </div>
                ))}
              </Form.Group>
            </>
          )}
          {role_id !== 6 && (
            <>
              <Form.Group>
                <Form.Label>Имя</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Введите имя"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  isInvalid={!!fieldErrors.name}
                />
                <Form.Control.Feedback type="invalid">
                  {fieldErrors.name}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group>
                <Form.Label>Фамилия</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Введите фамилию"
                  value={lastname}
                  onChange={(e) => setLastname(e.target.value)}
                  isInvalid={!!fieldErrors.lastname}
                />
                <Form.Control.Feedback type="invalid">
                  {fieldErrors.lastname}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group>
                <Form.Label>Отчество</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Введите отчество"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  isInvalid={!!fieldErrors.surname}
                />
                <Form.Control.Feedback type="invalid">
                  {fieldErrors.surname}
                </Form.Control.Feedback>
              </Form.Group>
            </>
          )}
          <Form.Group>
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Введите email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={!!user}
              isInvalid={!!fieldErrors.email}
            />
            <Form.Control.Feedback type="invalid">
              {fieldErrors.email}
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group>
            <Form.Label>Пароль</Form.Label>
            <InputGroup>
              <Form.Control
                type={showPassword ? "text" : "password"}
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isNotPassword}
                isInvalid={!!fieldErrors.password}
              />
              <Button onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </Button>
              {user && (
                <Button
                  variant="outline-secondary"
                  onClick={() => setIsNotPassword(!isNotPassword)}
                >
                  {isNotPassword ? "Менять" : "Не менять"}
                </Button>
              )}
              <Form.Control.Feedback type="invalid">
                {fieldErrors.password}
              </Form.Control.Feedback>
            </InputGroup>
          </Form.Group>
          <Form.Group>
            <Form.Label>Организация</Form.Label>
            <Form.Control
              type="text"
              placeholder="Введите организацию"
              value={organisation}
              onChange={(e) => setOrganisation(e.target.value)}
              required
              isInvalid={!!fieldErrors.organisation}
            />
            <Form.Control.Feedback type="invalid">
              {fieldErrors.organisation}
            </Form.Control.Feedback>
          </Form.Group>
          {role_id !== 5 && role_id !== 6 && (
            <Form.Group>
              <Form.Label>Роль</Form.Label>
              <Form.Select
                value={roleName}
                onChange={(e) => {
                  const selectedRole = roles.find(
                    (role) => role.name === e.target.value
                  );
                  setRole_id(selectedRole ? selectedRole.id : null);
                  setRoleName(e.target.value);
                }}
              >
                {roles.map(
                  (role) =>
                    isRoleAllowed(role) && (
                      <option key={role.id} value={role.name}>
                        {role.name}
                      </option>
                    )
                )}
              </Form.Select>
            </Form.Group>
          )}
          {role_id === 6 || role_id===5 ? (<>
            <Form.Group>
              <Form.Label>Роль</Form.Label>
              <Form.Control
                type="text"
                placeholder="Выберите роль"
                value={roleName}
                disabled
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Руководитель</Form.Label>
              <Form.Control
                placeholder="Фамилия Имя Отчество"
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
                isInvalid={!!fieldErrors.teacher}
              />
              <Form.Control.Feedback type="invalid">
                {fieldErrors.teacher}
              </Form.Control.Feedback>
            </Form.Group>
            </>
          ):(<></>)}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        {user ? (
          <Button
            variant="primary"
            onClick={handleUpdateUser}
            disabled={loading}
          >
            {loading ? <Spinner animation="border" size="sm" /> : "Изменить"}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleCreateUser}
            disabled={loading}
          >
            {loading ? <Spinner animation="border" size="sm" /> : "Создать"}
          </Button>
        )}
        <Button variant="secondary" onClick={handleModal} disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : "Отмена"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UserModal;
